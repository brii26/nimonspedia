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

// Store active timers untuk setiap auction
const auctionTimers: Map<number, NodeJS.Timeout> = new Map();
const auctionEndTimes: Map<number, number> = new Map();

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
      
      if (auction.status === 'scheduled' && auction.start_time) {
        const startTime = new Date(auction.start_time).getTime();
        timeLeft = Math.max(0, Math.floor((startTime - now) / 1000));
      } else if (auction.status === 'active' && auction.end_time) {
        const endTime = new Date(auction.end_time).getTime();
        timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
      } else if (auction.end_time) {
        const endTime = new Date(auction.end_time).getTime();
        timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
      } else {
        timeLeft = -1; // Infinite time
      }

      socket.emit('auction_joined', {
        auctionId: payload.auctionId,
        auction: {
          ...auction,
          bid_history: bidHistory
        },
        timeLeft: timeLeft
      });

      // Start timer jika belum ada dan ada end_time
      if (!auctionTimers.has(payload.auctionId) && auction.end_time && timeLeft > 0) {
        const endTime = new Date(auction.end_time).getTime();
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

      // Calculate new end time (extend by 15 seconds if within final 15 seconds)
      if (!auction.end_time) {
        socket.emit('bid_error', { message: 'Auction configuration error' });
        return;
      }

      let newEndTime = new Date(auction.end_time).getTime();
      const secondsUntilEnd = Math.floor((newEndTime - Date.now()) / 1000);
      
      if (secondsUntilEnd <= 15) {
        // Extend by 15 seconds
        newEndTime = Date.now() + (15 * 1000);

        // Update auction end time in database
        await auctionRepository.extendAuction(payload.auctionId, new Date(newEndTime));
      }

      // Update timer
      auctionEndTimes.set(payload.auctionId, newEndTime);

      // Clear existing timer
      if (auctionTimers.has(payload.auctionId)) {
        clearInterval(auctionTimers.get(payload.auctionId)!);
      }

      // Start new timer
      startAuctionTimer(io, payload.auctionId, newEndTime);

      // Broadcast new bid to all users in auction room
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

      // Send success response to bidder
      socket.emit('bid_placed', {
        auctionId: payload.auctionId,
        amount: payload.amount,
        newEndTime: newEndTime
      });

      console.log(`Bid placed: ${user.name} - Rp ${payload.amount} on auction ${payload.auctionId}`);

    } catch (error) {
      console.error('Place Bid Error:', error);
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

      // Check if user is the seller
      if (auction.owner_id !== user.user_id) {
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

  socket.on('get_auction_list', async (payload: { page: number, limit: number, filter?: string }) => {
    try {
        console.log('Server received get_auction_list request');
        const page = payload.page || 1;
        const limit = payload.limit || 8;
        
        let filter: 'active' | 'scheduled' = 'active';
        if (payload.filter === 'scheduled') {
          filter = 'scheduled';
        }

        const result = await auctionRepository.getAuctionsPaginated(page, limit, filter);

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
  let lastSyncTime = Date.now();
  
  const timer = setInterval(async () => {
    const now = Date.now();
    // Send ACTUAL time remaining - client will cap display to 15 seconds
    const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));

    // Broadcast timer update with actual value - client caps to 15 for display
    const timerUpdate: TimerUpdatePayload = {
      auctionId: auctionId,
      timeLeft: timeLeft // Send actual value
    };

    io.to(auctionRoom).emit('timer_update', timerUpdate);

    // Auto-sync dengan server setiap 30 detik untuk koreksi drift
    if (now - lastSyncTime >= 30000 && timeLeft > 0) {
      try {
        const auction = await auctionRepository.getAuctionById(auctionId);
        if (auction && auction.end_time) {
          const serverEndTime = new Date(auction.end_time).getTime();
          const serverTimeLeft = Math.max(0, Math.floor((serverEndTime - now) / 1000));
          
          if (Math.abs(serverTimeLeft - timeLeft) > 2) { // 2 second tolerance
            console.log(`Timer sync correction for auction ${auctionId}: ${timeLeft}s -> ${serverTimeLeft}s`);
            
            // Update stored end time
            auctionEndTimes.set(auctionId, serverEndTime);
            
            // Clear current timer and start new one
            clearInterval(timer);
            if (serverTimeLeft > 0) {
              startAuctionTimer(io, auctionId, serverEndTime);
            }
            return;
          }
        }
      } catch (error) {
        console.error(`Timer sync error for auction ${auctionId}:`, error);
      }
    }

    // Auction ended
    if (timeLeft <= 0) {
      clearInterval(timer);
      auctionTimers.delete(auctionId);
      auctionEndTimes.delete(auctionId);

      // Trigger auction end logic
      endAuction(io, auctionId);
    }
  }, 1000); // Update every second

  auctionTimers.set(auctionId, timer);
  console.log(`Timer started for auction ${auctionId}, ending at ${new Date(endTime).toISOString()}`);
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
    
    // Broadcast status update to ALL clients so list refreshes everywhere
    io.emit('auction_status_updated', {
      auction_id: auctionId,
      status: 'ended',
      updated_at: new Date()
    });

    console.log(`Auction ${auctionId} ended. Winner: ${finalAuction?.winner_name || 'No winner'}`);

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
      
      // Broadcast to ALL clients (not just room) so list refreshes
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

// Start periodic check for scheduled auctions (runs every 5 seconds)
export function startScheduledAuctionChecker(io: SocketIOServer): void {
  console.log('Starting scheduled auction checker...');
  setInterval(() => {
    checkScheduledAuctions(io);
  }, 5000); // Check every 5 seconds
  
  // Also run immediately on startup
  checkScheduledAuctions(io);
}

export async function recoverActiveAuctions(io: SocketIOServer): Promise<void> {
  console.log('System recovering: Checking active auctions...');
  
  try {
    const activeAuctions = await auctionRepository.findAllActiveAuctions();
    let recoveredCount = 0;
    let endedCount = 0;

    for (const auction of activeAuctions) {
      // Skip jika tidak punya end_time (belum mulai countdown)
      if (!auction.end_time) continue;

      const now = Date.now();
      const endTime = new Date(auction.end_time).getTime();

      if (endTime <= now) {
        // Kasus A: Lelang harusnya sudah berakhir saat server mati
        console.log(`Auction ${auction.auction_id} expired while server was down. Ending now...`);
        await endAuction(io, auction.auction_id);
        endedCount++;
      } else {
        // Kasus B: Lelang masih berjalan, nyalakan ulang timer
        // Cek apakah timer sudah jalan (untuk safety)
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