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

// Store active timers untuk setiap auction
const auctionTimers: Map<number, NodeJS.Timeout> = new Map();
const auctionEndTimes: Map<number, number> = new Map();

// Auction Socket Handlers
export default function registerAuctionHandlers(io: SocketIOServer, socket: AuthenticatedSocket): void {
  const user = socket.user;

  console.log(`Auction socket handlers registered for: ${user.name} (${user.user_id})`);

  // 1. Join Auction Room
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

      // Calculate time left
      const now = Date.now();
      let timeLeft = 0;
      
      if (auction.end_time) {
        const endTime = new Date(auction.end_time).getTime();
        timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
      } else {
        // Jika end_time null, auction berjalan indefinitely atau sampai ada bid
        timeLeft = -1; // Infinite time
      }

      socket.emit('auction_joined', {
        auctionId: payload.auctionId,
        auction: auction,
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

  // 2. Leave Auction Room
  socket.on('leave_auction', (payload: JoinAuctionPayload) => {
    const auctionRoom = `auction_${payload.auctionId}`;
    socket.leave(auctionRoom);
    console.log(`User ${user.name} left auction room: ${auctionRoom}`);
  });

  // 3. Place Bid
  socket.on('place_bid', async (payload: PlaceBidPayload) => {
    try {
      // Check feature flag
      const flagAccess = await featureFlagRepository.getUserFlag(user.user_id, 'auction_enabled');
      if (flagAccess && flagAccess.is_enabled === false) {
        socket.emit('auction_error', { 
          message: `Fitur Auction nonaktif: ${flagAccess.reason || 'Maintenance'}` 
        });
        return;
      }

      // Validate bid amount
      if (!payload.amount || payload.amount <= 0) {
        socket.emit('bid_error', { message: 'Bid amount harus lebih dari 0' });
        return;
      }

      // Get current auction data
      const auction = await auctionRepository.getAuctionById(payload.auctionId);
      if (!auction) {
        socket.emit('bid_error', { message: 'Auction tidak ditemukan' });
        return;
      }

      if (auction.owner_id === user.user_id) {
        socket.emit('bid_error', { message: 'Anda tidak dapat menawar barang Anda sendiri (Shill Bidding)' });
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

      // Check minimum bid
      const minimumBid = auction.current_price + auction.min_increment;
      if (payload.amount < minimumBid) {
        socket.emit('bid_error', { 
          message: `Bid minimum Rp ${minimumBid.toLocaleString('id-ID')}` 
        });
        return;
      }

      // Place bid in database
      const bidResult = await auctionRepository.placeBid(
        payload.auctionId,
        user.user_id,
        payload.amount
      );

      if (!bidResult.success) {
        socket.emit('bid_error', { message: bidResult.message || 'Gagal memasang bid' });
        return;
      }

      // Reset timer - extend auction by 15 seconds
      const newEndTime = Date.now() + (15 * 1000);
      await auctionRepository.extendAuction(payload.auctionId, new Date(newEndTime));
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
        timestamp: new Date().toISOString()
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

  // 4. Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${user.name} disconnected from auction socket`);
  });

  // 5. Heartbeat/Ping-Pong untuk keep-alive
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // 6. Request current auction status
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
        timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
      } else {
        timeLeft = -1; // Infinite time
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
}

// Helper function: Start auction countdown timer
const startAuctionTimer = (io: SocketIOServer, auctionId: number, endTime: number): void => {
  const auctionRoom = `auction_${auctionId}`;
  let lastSyncTime = Date.now();
  
  const timer = setInterval(async () => {
    const now = Date.now();
    const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));

    // Broadcast timer update
    const timerUpdate: TimerUpdatePayload = {
      auctionId: auctionId,
      timeLeft: timeLeft
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
    
    // Broadcast auction ended to all participants
    io.to(auctionRoom).emit('auction_ended', {
      auctionId: auctionId,
      finalPrice: finalAuction?.current_price,
      winner: finalAuction?.winner_name || null,
      endTime: new Date().toISOString()
    });

    console.log(`Auction ${auctionId} ended. Winner: ${finalAuction?.winner_name || 'No winner'}`);

  } catch (error) {
    console.error(`Error ending auction ${auctionId}:`, error);
  }
}