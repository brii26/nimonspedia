import { Server as SocketIOServer } from 'socket.io';
import { AuthenticatedSocket } from '../types/socket.js';
import { 
  JoinAuctionPayload, 
  PlaceBidPayload, 
  NewBidUpdatePayload, 
  TimerUpdatePayload,
} from '../types/socket-payloads.js';
import auctionRepository from '../repositories/auctionRepository.js';
import featureFlagRepository from '../repositories/featureFlagRepository.js';
import userRepository from '../repositories/userRepository.js';
import notificationService from '../services/notificationService.js';

// Store active timers untuk setiap auction
const auctionTimers: Map<number, NodeJS.Timeout> = new Map();
// Track remaining time (total time left until auction ends)
const auctionRemainingTime: Map<number, number> = new Map();
// Track display countdown (max 15s)
const auctionDisplayCountdown: Map<number, number> = new Map();
// Track if ending soon notification was sent for an auction
const endingSoonNotified: Set<number> = new Set();

// Export timer state getters for REST API access
export function getAuctionTimerState(auctionId: number): { remainingTime: number; displayCountdown: number } | null {
  const remaining = auctionRemainingTime.get(auctionId);
  const display = auctionDisplayCountdown.get(auctionId);
  if (remaining === undefined || display === undefined) {
    return null;
  }
  return { remainingTime: remaining, displayCountdown: display };
}

export function getAllAuctionTimerStates(): Map<number, { remainingTime: number; displayCountdown: number }> {
  const states = new Map<number, { remainingTime: number; displayCountdown: number }>();
  for (const [auctionId, remaining] of auctionRemainingTime) {
    const display = auctionDisplayCountdown.get(auctionId);
    if (display !== undefined) {
      states.set(auctionId, { remainingTime: remaining, displayCountdown: display });
    }
  }
  return states;
}

// Auction Socket Handlers
export default function registerAuctionHandlers(io: SocketIOServer, socket: AuthenticatedSocket): void {
  const user = socket.user;

  console.log(`Auction socket handlers registered for: ${user.name} (${user.user_id})`);

  // Join Auction Room
  socket.on('join_auction', async (payload: JoinAuctionPayload) => {
    try {
      // Check feature flag
      const flagAccess = await featureFlagRepository.getUserFlag(user.user_id, 'auction_enabled');
      if (flagAccess && flagAccess.is_enabled === false) {
        socket.emit('auction_error', { 
          message: `Fitur Auction nonaktif: ${flagAccess.reason || 'Maintenance'}` 
        });
        return;
      }

      const auctionRoom = `auction_${payload.auctionId}`;
      socket.join(auctionRoom);

      // Get auction info
      const auction = await auctionRepository.getAuctionById(payload.auctionId);
      if (!auction) {
        socket.emit('auction_error', { message: 'Auction tidak ditemukan' });
        return;
      }

      // Get bid history
      const bidHistory = await auctionRepository.getBidHistory(payload.auctionId, 10);

      const now = Date.now();
      let timeLeft = 0;
      let displayTimeLeft = 0;
      
      if (auction.status === 'scheduled' && auction.start_time) {
        const startTime = new Date(auction.start_time).getTime();
        timeLeft = Math.max(0, Math.floor((startTime - now) / 1000));
        displayTimeLeft = timeLeft; // No cap for scheduled
      } else if (auction.status === 'active' && auction.end_time) {
        // Use server-tracked values if available
        const trackedRemaining = auctionRemainingTime.get(payload.auctionId);
        const trackedDisplay = auctionDisplayCountdown.get(payload.auctionId);
        
        if (trackedRemaining !== undefined && trackedDisplay !== undefined) {
          timeLeft = trackedRemaining;
          displayTimeLeft = trackedDisplay;
        } else {
          // Initialize from database
          const endTime = new Date(auction.end_time).getTime();
          timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
          displayTimeLeft = Math.min(timeLeft, 15);
        }
      } else if (auction.end_time) {
        const endTime = new Date(auction.end_time).getTime();
        timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
        displayTimeLeft = Math.min(timeLeft, 15);
      } else {
        timeLeft = -1; // Infinite time
        displayTimeLeft = -1;
      }

      socket.emit('auction_joined', {
        auctionId: payload.auctionId,
        auction: {
          ...auction,
          bid_history: bidHistory
        },
        timeLeft: timeLeft,
        displayTimeLeft: displayTimeLeft
      });

      // Start timer jika belum ada dan ada end_time
      if (!auctionTimers.has(payload.auctionId) && auction.end_time && timeLeft > 0 && auction.status === 'active') {
        const endTime = new Date(auction.end_time).getTime();
        // Initialize remainingTime and displayCountdown before starting timer
        if (!auctionRemainingTime.has(payload.auctionId)) {
          auctionRemainingTime.set(payload.auctionId, timeLeft);
          auctionDisplayCountdown.set(payload.auctionId, Math.min(timeLeft, 15));
        }
        startAuctionTimer(io, payload.auctionId, endTime);
      }

      console.log(`User ${user.name} joined auction room: ${auctionRoom}`);

    } catch (error) {
      console.error('Join Auction Error:', error);
      socket.emit('auction_error', { message: 'Gagal join auction' });
    }
  });

  socket.on('update_auction_status', async (payload) => {
    const { auction_id, new_status } = payload;
    try {
      await auctionRepository.updateAuctionStatus(auction_id, new_status);
      
      // Broadcast ke SEMUA clients supaya list refresh
      io.emit('auction_status_updated', {
        auction_id,
        status: new_status,
        updated_at: new Date()
      });
      
      // Start timer if auction just became active
      if (new_status === 'active') {
        const auction = await auctionRepository.getAuctionById(auction_id);
        if (auction && auction.end_time) {
          const endTime = new Date(auction.end_time).getTime();
          if (endTime > Date.now() && !auctionTimers.has(auction_id)) {
            startAuctionTimer(io, auction_id, endTime);
          }
        }
      }
    } catch (error) {
      console.error('Error updating auction status:', error);
      socket.emit('error', { message: 'Failed to update auction status' });
    }
  });

  // Leave Auction Room
  socket.on('leave_auction', (payload: JoinAuctionPayload) => {
    const auctionRoom = `auction_${payload.auctionId}`;
    socket.leave(auctionRoom);
    console.log(`User ${user.name} left auction room: ${auctionRoom}`);
  });

  // Place Bid (broadcast only - balance already deducted by PHP)
  socket.on('place_bid', async (payload: PlaceBidPayload) => {
    try {
      // Get current auction data
      const auction = await auctionRepository.getAuctionById(payload.auctionId);
      if (!auction) {
        socket.emit('bid_error', { message: 'Auction tidak ditemukan' });
        return;
      }

      // Check if auction is still active
      const now = new Date();
      if (auction.end_time) {
        const endTime = new Date(auction.end_time);
        if (now >= endTime) {
          socket.emit('bid_error', { message: 'Auction sudah berakhir' });
          return;
        }
      }

      // Skip validation - REST API already validated and updated current_price
      // The bid is valid if we reach here since REST API returned success
      // payload.amount should now BE the current_price after REST API update

      // Apply the bid time logic:
      // remainingTime -= (15 - displayCountdown), then displayCountdown = 15
      // This "uses up" the time that passed since last bid, then grants 15s fresh
      
      let currentRemaining = auctionRemainingTime.get(payload.auctionId);
      let currentDisplay = auctionDisplayCountdown.get(payload.auctionId);
      
      // If timer not yet started, initialize from database end_time
      if (currentRemaining === undefined || currentDisplay === undefined) {
        if (!auction.end_time) {
          socket.emit('bid_error', { message: 'Auction configuration error' });
          return;
        }
        const endTime = new Date(auction.end_time).getTime();
        currentRemaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        currentDisplay = Math.min(currentRemaining, 15);
        
        // Initialize the maps so timer can use them
        auctionRemainingTime.set(payload.auctionId, currentRemaining);
        auctionDisplayCountdown.set(payload.auctionId, currentDisplay);
      }
      
      const timeUsed = Math.max(0, 15 - currentDisplay);
      let newRemaining = currentRemaining - timeUsed + 15;
      newRemaining = Math.max(15, newRemaining);
      
	  const newDisplay = 15;
      auctionRemainingTime.set(payload.auctionId, newRemaining);
      auctionDisplayCountdown.set(payload.auctionId, newDisplay);
      
      const newEndTime = Date.now() + (newRemaining * 1000);
      await auctionRepository.extendAuction(payload.auctionId, new Date(newEndTime));

      if (auctionTimers.has(payload.auctionId)) {
        clearInterval(auctionTimers.get(payload.auctionId)!);
      }

      startAuctionTimer(io, payload.auctionId, newEndTime);
      const auctionRoom = `auction_${payload.auctionId}`;
      const bidUpdate: NewBidUpdatePayload = {
        auctionId: payload.auctionId,
        bidderName: user.name,
        amount: payload.amount,
        timestamp: new Date().toISOString(),
        bidderId: user.user_id,
        newEndTime: newEndTime
      };

      io.to(auctionRoom).emit('new_bid', bidUpdate);

      try {
        const bidHistory = await auctionRepository.getBidHistory(payload.auctionId, 2);
        if (bidHistory.length >= 2) {
          const previousBidder = bidHistory[1];
          if (previousBidder.bidder_id !== user.user_id) {
            const baseUrl = process.env.CLIENT_URL || 'http://localhost:8080';
            await notificationService.sendNotification(previousBidder.bidder_id, 'auction', {
              title: 'Anda Dikalahkan dalam Lelang! 😢',
              body: `Produk "${auction.product_name || 'Lelang'}" telah dibid dengan harga Rp ${new Intl.NumberFormat('id-ID').format(payload.amount)}. Anda dapat mengajukan bid baru.`,
              url: `${baseUrl}/auction/${payload.auctionId}`,
              icon: '/assets/icons/auction-outbid.png',
              tag: `auction-outbid-${payload.auctionId}`,
              data: { type: 'auction_outbid', auctionId: payload.auctionId }
            });
            console.log(`Outbid notification sent to user ${previousBidder.bidder_id}`);
          }
        }
      } catch (notifError) {
        console.error('Failed to send outbid notification:', notifError);
      }

      // Send success response to bidder
      socket.emit('bid_placed', {
        auctionId: payload.auctionId,
        amount: payload.amount,
        newEndTime: newEndTime
      });

      console.log(`Bid placed: ${user.name} - Rp ${payload.amount} on auction ${payload.auctionId}, remaining: ${newRemaining}s, display: ${newDisplay}s`);

    } catch (error: any) {
      console.error('Place Bid Error:', error?.message || error, error?.stack);
      socket.emit('bid_error', { message: 'Gagal memasang bid' });
    }
  });

  // Stop Auction (Seller Only)
  socket.on('stop_auction', async (payload: JoinAuctionPayload) => {
    try {
      const auction = await auctionRepository.getAuctionById(payload.auctionId);
      if (!auction) {
        socket.emit('auction_error', { message: 'Auction tidak ditemukan' });
        return;
      }

      if (String(auction.owner_id) !== String(user.user_id)) {
        console.log(`Stop auction denied: owner_id=${auction.owner_id} (${typeof auction.owner_id}), user_id=${user.user_id} (${typeof user.user_id})`);
        socket.emit('auction_error', { message: 'Anda bukan penjual auction ini' });
        return;
      }

      // End the auction
      await auctionRepository.endAuction(payload.auctionId);

      // Broadcast to all users in auction room
      const auctionRoom = `auction_${payload.auctionId}`;
      io.to(auctionRoom).emit('auction_ended', {
        auctionId: payload.auctionId,
        winner: auction.winner_name || null,
        finalPrice: auction.current_price,
        endTime: new Date().toISOString()
      });

      console.log(`Auction ${payload.auctionId} stopped by seller ${user.name}`);
    } catch (error) {
      console.error('Stop Auction Error:', error);
      socket.emit('auction_error', { message: 'Gagal menghentikan auction' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${user.name} disconnected from auction socket`);
  });

  // Heartbeat/Ping-Pong untuk keep-alive
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // Request current auction status
  socket.on('get_auction_status', async (payload: JoinAuctionPayload) => {
    try {
      const auction = await auctionRepository.getAuctionById(payload.auctionId);
      if (!auction) {
        socket.emit('auction_error', { message: 'Auction tidak ditemukan' });
        return;
      }

      const now = Date.now();
      let timeLeft = 0;
      
      if (auction.end_time) {
        const endTime = new Date(auction.end_time).getTime();
        const actualTimeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
        
        // If auction is ACTIVE, cap display at 15 seconds
        if (auction.status === 'active') {
          timeLeft = Math.min(actualTimeLeft, 15);
        } else {
          timeLeft = actualTimeLeft;
        }
      } else {
        timeLeft = -1;
      }

      socket.emit('auction_status', {
        auctionId: payload.auctionId,
        currentPrice: auction.current_price,
        highestBidder: auction.winner_name,
        timeLeft: timeLeft,
        isActive: auction.status === 'active' && timeLeft !== 0
      });

    } catch (error) {
      console.error('Get Auction Status Error:', error);
      socket.emit('auction_error', { message: 'Gagal mengambil status auction' });
    }
  });

  socket.on('get_auction_list', async (payload: { page: number, limit: number, filter?: string, search?: string }) => {
    try {
        console.log('Server received get_auction_list request');
        const page = payload.page || 1;
        const limit = payload.limit || 8;
        const search = payload.search?.trim() || '';
        
        let filter: 'active' | 'scheduled' | 'ended' = 'active';
        if (payload.filter === 'scheduled') {
          filter = 'scheduled';
        } else if (payload.filter === 'ended') {
          filter = 'ended';
        }

        const result = await auctionRepository.getAuctionsPaginated(page, limit, filter, search);

        socket.emit('auction_list_response', {
            data: result.data,
            total: result.total,
            page: page,
            totalPages: Math.ceil(result.total / limit)
        });

    } catch (error) {
        console.error('Get List Error:', error);
        socket.emit('auction_error', { message: 'Failed to fetch auction list' });
    }
  });
}

// Helper function: Start auction countdown timer
const startAuctionTimer = (io: SocketIOServer, auctionId: number, endTime: number): void => {
  const auctionRoom = `auction_${auctionId}`;
  if (!auctionRemainingTime.has(auctionId)) {
    const initialRemaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    auctionRemainingTime.set(auctionId, initialRemaining);
    auctionDisplayCountdown.set(auctionId, Math.min(initialRemaining, 15));
  }
  
  const timer = setInterval(async () => {
    let remainingTime = auctionRemainingTime.get(auctionId) || 0;
    let displayCountdown = auctionDisplayCountdown.get(auctionId) || 0;
    
    remainingTime = Math.max(0, remainingTime - 1);
    displayCountdown = Math.max(0, displayCountdown - 1);
    
    displayCountdown = Math.min(displayCountdown, remainingTime);
    
    // Store updated values
    auctionRemainingTime.set(auctionId, remainingTime);
    auctionDisplayCountdown.set(auctionId, displayCountdown);

    // Broadcast timer update 
    const timerUpdate: TimerUpdatePayload = {
      auctionId: auctionId,
      timeLeft: remainingTime,
      displayTimeLeft: displayCountdown 
    };

    io.to(auctionRoom).emit('timer_update', timerUpdate);

    // Send "ending soon" push notification at 5 seconds of displayCountdown (only once per auction)
    if (displayCountdown === 5 && !endingSoonNotified.has(auctionId)) {
      endingSoonNotified.add(auctionId);
      try {
        const auction = await auctionRepository.getAuctionById(auctionId);
        const bidHistory = await auctionRepository.getBidHistory(auctionId, 50);
        
        // Notify all unique bidders about ending soon
        const notifiedUsers = new Set<number>();
        const baseUrl = process.env.CLIENT_URL || 'http://localhost:8080';
        
        for (const bid of bidHistory) {
          if (!notifiedUsers.has(bid.bidder_id)) {
            notifiedUsers.add(bid.bidder_id);
            await notificationService.sendNotification(bid.bidder_id, 'auction', {
              title: 'Lelang Akan Segera Berakhir! ⏰',
              body: `Lelang "${auction?.product_name || 'Produk'}" akan berakhir dalam 5 detik. Bid sekarang!`,
              url: `${baseUrl}/auction/${auctionId}`,
              icon: '/assets/icons/auction-ending.png',
              tag: `auction-ending-${auctionId}`,
              data: { type: 'auction_ending_soon', auctionId }
            });
          }
        }
        console.log(`Ending soon notifications sent to ${notifiedUsers.size} bidders for auction ${auctionId}`);
      } catch (notifError) {
        console.error('Failed to send ending soon notifications:', notifError);
      }
    }

    if (displayCountdown <= 0) {
      clearInterval(timer);
      auctionTimers.delete(auctionId);
      auctionRemainingTime.delete(auctionId);
      auctionDisplayCountdown.delete(auctionId);
      endAuction(io, auctionId);
    }
  }, 1000); 

  auctionTimers.set(auctionId, timer);
  console.log(`Timer started for auction ${auctionId}, remainingTime: ${auctionRemainingTime.get(auctionId)}s, displayCountdown: ${auctionDisplayCountdown.get(auctionId)}s`);
}

// Helper function: End auction
const endAuction = async (io: SocketIOServer, auctionId: number): Promise<void> => {
  try {
    console.log(`Ending auction ${auctionId}`);
    
    const auctionRoom = `auction_${auctionId}`;
    
    // Mark auction as ended in database
    await auctionRepository.endAuction(auctionId);
    
    // Get final auction result
    const finalAuction = await auctionRepository.getAuctionById(auctionId);
    
    // Broadcast auction ended to users in the auction room
    io.to(auctionRoom).emit('auction_ended', {
      auctionId: auctionId,
      finalPrice: finalAuction?.current_price,
      winner: finalAuction?.winner_name || null,
      endTime: new Date().toISOString()
    });
    
    // Broadcast status update to ALL clients 
    io.emit('auction_status_updated', {
      auction_id: auctionId,
      status: 'ended',
      updated_at: new Date()
    });

    endingSoonNotified.delete(auctionId);
    if (finalAuction?.winner_id) {
      try {
        const baseUrl = process.env.CLIENT_URL || 'http://localhost:8080';
        await notificationService.sendNotification(finalAuction.winner_id, 'auction', {
          title: 'Selamat! Anda Memenangkan Lelang! 🎉',
          body: `Anda telah memenangkan lelang "${finalAuction.product_name || 'Produk'}" dengan harga Rp ${new Intl.NumberFormat('id-ID').format(finalAuction.current_price || 0)}.`,
          url: `${baseUrl}/auction/${auctionId}`,
          icon: '/assets/icons/auction-won.png',
          tag: `auction-won-${auctionId}`,
          data: { type: 'auction_won', auctionId }
        });
        console.log(`Auction won notification sent to winner ${finalAuction.winner_id}`);
      } catch (notifError) {
        console.error('Failed to send auction won notification:', notifError);
      }
    }

  } catch (error) {
    console.error(`Error ending auction ${auctionId}:`, error);
  }
}

// Check and activate scheduled auctions that have reached their start time
export async function checkScheduledAuctions(io: SocketIOServer): Promise<void> {
  try {
    const scheduledAuctions = await auctionRepository.findScheduledToActivate();
    
    for (const auction of scheduledAuctions) {
      console.log(`Activating scheduled auction ${auction.auction_id}: ${auction.product_name || 'Unknown'}`);
      
      // Update status to active
      await auctionRepository.updateAuctionStatus(auction.auction_id, 'active');
      
      // Broadcast to ALL clients 
      io.emit('auction_status_updated', {
        auction_id: auction.auction_id,
        status: 'active',
        updated_at: new Date()
      });
      
      // Start timer if auction has end_time
      if (auction.end_time) {
        const endTime = new Date(auction.end_time).getTime();
        if (endTime > Date.now() && !auctionTimers.has(auction.auction_id)) {
          startAuctionTimer(io, auction.auction_id, endTime);
        }
      }
    }
    
    if (scheduledAuctions.length > 0) {
      console.log(`Activated ${scheduledAuctions.length} scheduled auctions`);
    }
  } catch (error) {
    console.error('Error checking scheduled auctions:', error);
  }
}

export function startScheduledAuctionChecker(io: SocketIOServer): void {
  console.log('Starting scheduled auction checker...');
  setInterval(() => {
    checkScheduledAuctions(io);
  }, 5000);
  checkScheduledAuctions(io);
}

export async function recoverActiveAuctions(io: SocketIOServer): Promise<void> {
  console.log('System recovering: Checking active auctions...');
  
  try {
    const activeAuctions = await auctionRepository.findAllActiveAuctions();
    let recoveredCount = 0;
    let endedCount = 0;

    for (const auction of activeAuctions) {
      if (!auction.end_time) continue;

      const now = Date.now();
      const endTime = new Date(auction.end_time).getTime();

      if (endTime <= now) {
        console.log(`Auction ${auction.auction_id} expired while server was down. Ending now...`);
        await endAuction(io, auction.auction_id);
        endedCount++;
      } else {
        if (!auctionTimers.has(auction.auction_id)) {
          startAuctionTimer(io, auction.auction_id, endTime);
          recoveredCount++;
        }
      }
    }

    console.log(`Recovery complete: ${recoveredCount} timers restarted, ${endedCount} expired auctions closed.`);
    
  } catch (error) {
    console.error('Failed to recover auctions:', error);
  }
}