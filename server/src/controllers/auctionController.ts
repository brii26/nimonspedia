import { FastifyRequest, FastifyReply } from 'fastify';
import pool from '../config/database.js';
import userRepository from '../repositories/userRepository.js';
import auctionService from '../services/auctionService.js';
import { getAllAuctionTimerStates } from '../sockets/auctionSocket.js';

class AuctionController {


  async getAuctionParticipants(request: FastifyRequest, reply: FastifyReply) {
    try {
      const auctionId = Number((request.params as any).id);
      if (!auctionId) {
        return reply.status(400).send({ success: false, message: 'Missing auction id' });
      }
      const participants = await auctionService.getAuctionParticipants(auctionId);
      return reply.send({ success: true, participants });
    } catch (error: any) {
      console.error('[GetAuctionParticipants] ERROR:', error);
      return reply.status(500).send({ success: false, message: error.message || 'Failed to get participants' });
    }
  }


  async placeBid(request: FastifyRequest, reply: FastifyReply) {
    const client = await pool.connect();

    try {
      const { auction_id, bid_amount } = request.body as { auction_id: number; bid_amount: number };
      let userId = (request.user as any)?.user_id;

      // Convert to number if it's a string (from PHP session)
      if (userId) {
        userId = parseInt(userId, 10);
      }

      console.log('[PlaceBid] userId:', userId, 'auction_id:', auction_id, 'bid_amount:', bid_amount);

      if (!userId) {
        console.log('[PlaceBid] ERROR: Not authenticated');
        return reply.status(401).send({ success: false, message: 'Not authenticated' });
      }

      if (!auction_id || !bid_amount) {
        console.log('[PlaceBid] ERROR: Missing required fields');
        return reply.status(400).send({ success: false, message: 'Missing auction_id or bid_amount' });
      }

      await client.query('BEGIN');

      // Get user's current balance from database using repository
      console.log('[PlaceBid] Querying user balance for user_id:', userId);
      const user = await userRepository.getUserForUpdateWithClient(client, userId);

      if (!user) {
        await client.query('ROLLBACK');
        console.log('[PlaceBid] ERROR: User not found for user_id:', userId);
        return reply.status(404).send({ success: false, message: 'User not found' });
      }

      const userBalance = parseFloat(String(user.balance)) || 0;

      console.log('[PlaceBid] Current balance:', userBalance, 'Bid amount:', bid_amount);

      if (userBalance < bid_amount) {
        await client.query('ROLLBACK');
        console.log('[PlaceBid] ERROR: Insufficient balance');
        return reply.status(400).send({ success: false, message: 'Insufficient balance' });
      }

      const auction = await auctionService.getAuctionForBiddingWithClient(client, auction_id);

      if (!auction) {
        await client.query('ROLLBACK');
        console.log('[PlaceBid] ERROR: Auction not found for auction_id:', auction_id);
        return reply.status(404).send({ success: false, message: 'Auction not found' });
      }

      const previousWinnerId = auction.winner_id;
      const previousBidAmount = parseFloat(String(auction.current_price)) || 0;

      if (previousWinnerId) {
        console.log('[PlaceBid] Refunding previous bidder userId:', previousWinnerId, 'amount:', previousBidAmount);
        await userRepository.addBalanceWithClient(client, previousWinnerId, previousBidAmount);
      }

      // Deduct balance
      const updatedUser = await userRepository.deductBalanceWithClient(client, userId, bid_amount);
      const newBalance = parseFloat(String(updatedUser?.balance)) || 0;
      console.log('[PlaceBid] Balance updated via userRepository: new=', newBalance);

      // Insert new bid 
      const bidId = await auctionService.insertBidWithClient(client, auction_id, userId, bid_amount);

      // Update auction 
      await auctionService.updateAuctionBidWithClient(client, auction_id, bid_amount, userId);

      await client.query('COMMIT');

      console.log('[PlaceBid] SUCCESS: Balance updated, bid placed, previous bidder refunded');

      return reply.send({
        success: true,
        message: 'Bid placed successfully',
        data: {
          bid_id: bidId,
          new_price: bid_amount,
          timestamp: new Date().toISOString()
        },
        new_balance: newBalance
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('[PlaceBid] CRITICAL ERROR:', error);
      return reply.status(500).send({ success: false, message: error.message || 'Failed to place bid' });
    } finally {
      client.release();
    }
  }

  async getUserBalance(request: FastifyRequest, reply: FastifyReply) {
    try {
      let userId = (request.user as any)?.user_id;

      if (userId) {
        userId = parseInt(userId, 10);
      }

      console.log('[GetBalance] userId:', userId);

      if (!userId) {
        console.log('[GetBalance] ERROR: Not authenticated');
        return reply.status(401).send({ success: false, message: 'Not authenticated' });
      }

      const balance = await userRepository.getBalance(String(userId));
      console.log('[GetBalance] SUCCESS: balance=', balance);

      return reply.send({
        success: true,
        balance: balance
      });

    } catch (error: any) {
      console.error('[GetBalance] CRITICAL ERROR:', error);
      return reply.status(500).send({ success: false, message: error.message || 'Failed to get balance' });
    }
  }

  async getAuctionList(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { page = '1', limit = '8', filter = 'active', search = '' } = request.query as {
        page?: string;
        limit?: string;
        filter?: string;
        search?: string;
      };

      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 8;
      const searchTerm = search.trim();
      const filterType = (filter === 'active' || filter === 'scheduled' || filter === 'ended') ? filter : 'active';
      const { data, total } = await auctionService.getAuctionsPaginated(pageNum, limitNum, filterType, searchTerm);

      // Map to include title field for backwards compatibility
      const mappedData = data.map(item => ({
        ...item,
        title: item.product_name
      }));

      return reply.send({
        success: true,
        data: mappedData,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      });

    } catch (error: any) {
      console.error('[GetAuctionList] ERROR:', error);
      return reply.status(500).send({ success: false, message: error.message || 'Failed to get auctions' });
    }
  }

  async getTimers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const now = Date.now();
      const timers: Record<number, { timeLeft: number; displayTimeLeft: number }> = {};

      const timerStates = getAllAuctionTimerStates();
      const activeAuctions = await auctionService.getActiveAuctionsForTimers();

      for (const row of activeAuctions) {
        const auctionId = row.auction_id;

        const inMemoryState = timerStates.get(auctionId);
        if (inMemoryState) {
          timers[auctionId] = {
            timeLeft: inMemoryState.remainingTime,
            displayTimeLeft: inMemoryState.displayCountdown
          };
        } else {
          const endTime = new Date(row.end_time).getTime();
          const actualTimeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
          const displayTimeLeft = Math.min(actualTimeLeft, 15);

          timers[auctionId] = {
            timeLeft: actualTimeLeft,
            displayTimeLeft: displayTimeLeft
          };
        }
      }

      return reply.send({
        success: true,
        timers: timers,
        serverTime: now
      });

    } catch (error: any) {
      console.error('[GetTimers] ERROR:', error);
      return reply.status(500).send({ success: false, message: error.message || 'Failed to get timers' });
    }
  }
}

export default new AuctionController();
