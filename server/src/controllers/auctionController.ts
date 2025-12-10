import { FastifyRequest, FastifyReply } from 'fastify';
import pool from '../config/database.js';
import userRepository from '../repositories/userRepository.js';

class AuctionController {
  
  /**
   * Place a bid on an auction with refund logic for previous bidder
   * POST /auctions/place-bid
   */
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

      // Get auction details from database
      const auctionResult = await client.query(
        'SELECT auction_id, current_price, min_increment, winner_id FROM auctions WHERE auction_id = $1 FOR UPDATE',
        [auction_id]
      );

      if (auctionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        console.log('[PlaceBid] ERROR: Auction not found for auction_id:', auction_id);
        return reply.status(404).send({ success: false, message: 'Auction not found' });
      }

      const auction = auctionResult.rows[0];
      const previousWinnerId = auction.winner_id;
      const previousBidAmount = parseFloat(auction.current_price) || 0;

      // Always refund previous bid amount if there was a previous winner
      // This includes same user bidding higher (they get their previous bid back)
      if (previousWinnerId) {
        console.log('[PlaceBid] Refunding previous bidder userId:', previousWinnerId, 'amount:', previousBidAmount);
        await userRepository.addBalanceWithClient(client, previousWinnerId, previousBidAmount);
      }

      // Deduct balance from current bidder using repository
      const updatedUser = await userRepository.deductBalanceWithClient(client, userId, bid_amount);
      const newBalance = parseFloat(String(updatedUser?.balance)) || 0;
      console.log('[PlaceBid] Balance updated via userRepository: new=', newBalance);

      // Insert new bid record
      const bidInsertResult = await client.query(
        'INSERT INTO auction_bids (auction_id, bidder_id, bid_amount, bid_time) VALUES ($1, $2, $3, NOW()) RETURNING bid_id',
        [auction_id, userId, bid_amount]
      );

      const bidId = bidInsertResult.rows[0].bid_id;

      // Update auction with new current_price and winner_id
      await client.query(
        'UPDATE auctions SET current_price = $1, winner_id = $2 WHERE auction_id = $3',
        [bid_amount, userId, auction_id]
      );

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

  /**
   * Get user's current balance
   * GET /auctions/user/balance
   */
  async getUserBalance(request: FastifyRequest, reply: FastifyReply) {
    try {
      let userId = (request.user as any)?.user_id;

      // Convert to number if it's a string (from PHP session)
      if (userId) {
        userId = parseInt(userId, 10);
      }

      console.log('[GetBalance] userId:', userId);

      if (!userId) {
        console.log('[GetBalance] ERROR: Not authenticated');
        return reply.status(401).send({ success: false, message: 'Not authenticated' });
      }

      const result = await pool.query(
        'SELECT balance FROM users WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        console.log('[GetBalance] ERROR: User not found for user_id:', userId);
        return reply.status(404).send({ success: false, message: 'User not found' });
      }

      const balance = parseFloat(result.rows[0].balance) || 0;
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
}

export default new AuctionController();
