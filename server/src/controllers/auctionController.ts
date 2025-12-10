import { FastifyRequest, FastifyReply } from 'fastify';
import pool from '../config/database.js';
import userRepository from '../repositories/userRepository.js';
import { getAllAuctionTimerStates } from '../sockets/auctionSocket.js';

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

      if (previousWinnerId) {
        console.log('[PlaceBid] Refunding previous bidder userId:', previousWinnerId, 'amount:', previousBidAmount);
        await userRepository.addBalanceWithClient(client, previousWinnerId, previousBidAmount);
      }

      // Deduct balance
      const updatedUser = await userRepository.deductBalanceWithClient(client, userId, bid_amount);
      const newBalance = parseFloat(String(updatedUser?.balance)) || 0;
      console.log('[PlaceBid] Balance updated via userRepository: new=', newBalance);

      // Insert new bid
      const bidInsertResult = await client.query(
        'INSERT INTO auction_bids (auction_id, bidder_id, bid_amount, bid_time) VALUES ($1, $2, $3, NOW()) RETURNING bid_id',
        [auction_id, userId, bid_amount]
      );

      const bidId = bidInsertResult.rows[0].bid_id;

      // Update auction
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
      const offset = (pageNum - 1) * limitNum;
      const searchTerm = search.trim();

      let statusFilter = '';
      let orderBy = 'ORDER BY a.start_time ASC';

      if (filter === 'active') {
        statusFilter = "WHERE a.status = 'active' AND a.end_time > NOW()";
      } else if (filter === 'scheduled') {
        statusFilter = "WHERE a.status = 'scheduled'";
      } else if (filter === 'ended') {
        statusFilter = "WHERE a.status = 'ended'";
        orderBy = 'ORDER BY a.end_time DESC';
      } else {
        statusFilter = "WHERE a.status = 'active' AND a.end_time > NOW()";
      }

      // Build search filter
      let searchFilter = '';

      if (searchTerm) {
        searchFilter = ` AND (LOWER(p.product_name) LIKE LOWER($1) OR LOWER(s.store_name) LIKE LOWER($1))`;
      }

      // Count query
      const countQuery = `
        SELECT COUNT(*) FROM auctions a
        JOIN products p ON a.product_id = p.product_id
        JOIN stores s ON p.store_id = s.store_id
        ${statusFilter}${searchFilter}
      `;

      const countResult = searchTerm
        ? await pool.query(countQuery, [`%${searchTerm}%`])
        : await pool.query(countQuery.replace(searchFilter, ''));
      const total = parseInt(countResult.rows[0].count);

      // Data query 
      let dataQuery: string;
      let dataParams: any[];

      if (searchTerm) {
        dataQuery = `
          SELECT 
            a.auction_id as id,
            a.product_id,
            a.starting_price,
            a.current_price,
            a.min_increment,
            a.start_time,
            a.end_time,
            a.status,
            a.winner_id,
            p.product_name AS title,
            p.main_image_path AS image,
            s.store_name,
            u.name AS winner_name,
            (SELECT COUNT(*) FROM auction_bids ab WHERE ab.auction_id = a.auction_id) as bid_count
          FROM auctions a
          JOIN products p ON a.product_id = p.product_id
          JOIN stores s ON p.store_id = s.store_id
          LEFT JOIN users u ON a.winner_id = u.user_id
          ${statusFilter} AND (LOWER(p.product_name) LIKE LOWER($1) OR LOWER(s.store_name) LIKE LOWER($1))
          ${orderBy}
          LIMIT $2 OFFSET $3
        `;
        dataParams = [`%${searchTerm}%`, limitNum, offset];
      } else {
        dataQuery = `
          SELECT 
            a.auction_id as id,
            a.product_id,
            a.starting_price,
            a.current_price,
            a.min_increment,
            a.start_time,
            a.end_time,
            a.status,
            a.winner_id,
            p.product_name AS title,
            p.main_image_path AS image,
            s.store_name,
            u.name AS winner_name,
            (SELECT COUNT(*) FROM auction_bids ab WHERE ab.auction_id = a.auction_id) as bid_count
          FROM auctions a
          JOIN products p ON a.product_id = p.product_id
          JOIN stores s ON p.store_id = s.store_id
          LEFT JOIN users u ON a.winner_id = u.user_id
          ${statusFilter}
          ${orderBy}
          LIMIT $1 OFFSET $2
        `;
        dataParams = [limitNum, offset];
      }

      const dataResult = await pool.query(dataQuery, dataParams);

      const data = dataResult.rows.map((row: any) => ({
        id: row.id,
        product_id: row.product_id,
        product_name: row.title,
        title: row.title,
        image: row.image,
        store_name: row.store_name,
        starting_price: parseFloat(row.starting_price),
        current_price: row.current_price ? parseFloat(row.current_price) : parseFloat(row.starting_price),
        min_increment: parseFloat(row.min_increment),
        start_time: row.start_time,
        end_time: row.end_time,
        status: row.status,
        bid_count: parseInt(row.bid_count || '0'),
        winner_name: row.winner_name
      }));

      return reply.send({
        success: true,
        data,
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
      const result = await pool.query(`
        SELECT auction_id, end_time, status
        FROM auctions
        WHERE status = 'active' AND end_time > NOW()
      `);

      for (const row of result.rows) {
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
