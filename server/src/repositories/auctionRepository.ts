import pool from '../config/database.js';
import orderRepository from './orderRepository.js';
import { QueryResult } from 'pg';
import { AuctionListItem } from '../types/socket-payloads.js';

interface Auction {
  auction_id: number;
  product_id: number;
  store_id: number;
  owner_id: number;
  starting_price: number;
  current_price: number;
  min_increment: number;
  quantity: number;
  start_time: string;
  end_time: string | null;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  winner_id: number | null;
  created_at: string;
  winner_name?: string | null;
  product_name?: string;
  image?: string | null;
}

class AuctionRepository {
  
  // Get Auction By ID (Detail Page)
  async getAuctionById(auctionId: number): Promise<Auction | null> {
    const result = await pool.query(`
      SELECT 
        a.*,
        u.name as winner_name,
        p.product_name,
        p.description,
        p.store_id,
        p.main_image_path AS image,
        s.user_id AS owner_id,
        s.store_name
      FROM auctions a
      LEFT JOIN users u ON a.winner_id = u.user_id
      LEFT JOIN products p ON a.product_id = p.product_id
      LEFT JOIN stores s ON p.store_id = s.store_id
      WHERE a.auction_id = $1
    `, [auctionId]);
    
    return result.rows[0] || null;
  }

  // Get Bid History for Auction
  async getBidHistory(auctionId: number, limit: number = 10): Promise<any[]> {
    const result = await pool.query(`
      SELECT 
        ab.bid_id,
        ab.bidder_id,
        u.name as bidder_name,
        ab.bid_amount as amount,
        ab.bid_time as time
      FROM auction_bids ab
      JOIN users u ON ab.bidder_id = u.user_id
      WHERE ab.auction_id = $1
      ORDER BY ab.bid_time DESC
      LIMIT $2
    `, [auctionId, limit]);
    
    return result.rows;
  }

  // Extend Auction
  async extendAuction(auctionId: number, newEndTime: Date): Promise<QueryResult> {
    return await pool.query(`
      UPDATE auctions SET end_time = $1 WHERE auction_id = $2
    `, [newEndTime, auctionId]);
  }

  // End Auction
  async endAuction(auctionId: number): Promise<QueryResult> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const highestBidResult = await client.query(`
        SELECT bidder_id, bid_amount FROM auction_bids 
        WHERE auction_id = $1 ORDER BY bid_amount DESC, bid_time ASC LIMIT 1
      `, [auctionId]);

      let winnerId: number | null = null;
      let finalPrice = 0;

      if (highestBidResult.rows.length > 0) {
        winnerId = highestBidResult.rows[0].bidder_id;
        finalPrice = Number(highestBidResult.rows[0].bid_amount);
      }

      const result = await client.query(`
        UPDATE auctions 
        SET status = 'ended', end_time = NOW(), winner_id = $1, current_price = $2
        WHERE auction_id = $3 AND status = 'active'
      `, [winnerId, finalPrice, auctionId]);

      if (winnerId) {
        const infoQuery = await client.query(`
            SELECT p.product_id, p.store_id, u.address as shipping_address, a.quantity
            FROM auctions a
            JOIN products p ON a.product_id = p.product_id
            JOIN users u ON u.user_id = $1
            WHERE a.auction_id = $2
        `, [winnerId, auctionId]);

        if (infoQuery.rows.length > 0) {
          const info = infoQuery.rows[0];
          await orderRepository.createOrder({
            buyer_id: winnerId,
            store_id: info.store_id,
            total_price: finalPrice,
            shipping_address: info.shipping_address || '-'
          }, [{
            product_id: info.product_id,
            quantity: info.quantity,
            price: info.quantity > 0 ? Math.floor(finalPrice / info.quantity) : finalPrice,
            subtotal: finalPrice
          }], client);
        }
      } else {
        const auctionInfo = await client.query(`
          SELECT product_id, quantity FROM auctions WHERE auction_id = $1
        `, [auctionId]);
        
        if (auctionInfo.rows.length > 0) {
          const { product_id, quantity } = auctionInfo.rows[0];
          await client.query(`
            UPDATE products SET stock = stock + $1 WHERE product_id = $2
          `, [quantity, product_id]);
          console.log(`Restored ${quantity} stock to product ${product_id} - auction ${auctionId} had no bids`);
        }
      }

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("End Auction Error:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get Auctions List (Paginated)
  async getAuctionsPaginated(page: number, limit: number, filter: 'active' | 'scheduled' | 'ended', search: string = ''): Promise<{ data: AuctionListItem[], total: number }> {
      const offset = (page - 1) * limit;
  
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
      
      // Add search filter 
      let searchFilter = '';
      const queryParams: (string | number)[] = [limit, offset];
      
      if (search) {
          searchFilter = ` AND (LOWER(p.product_name) LIKE LOWER($3) OR LOWER(s.store_name) LIKE LOWER($3))`;
          queryParams.push(`%${search}%`);
      }
  
      // Query Count with search
      const countQuery = search 
          ? await pool.query(`
              SELECT COUNT(*) FROM auctions a
              JOIN products p ON a.product_id = p.product_id
              JOIN stores s ON p.store_id = s.store_id
              ${statusFilter}${searchFilter}
            `, [`%${search}%`])
          : await pool.query(`SELECT COUNT(*) FROM auctions a ${statusFilter}`);
      const total = parseInt(countQuery.rows[0].count);
  
      // Query Data with search
      const dataQuery = `
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
          ${statusFilter}${searchFilter}
          ${orderBy}
          LIMIT $1 OFFSET $2
      `;
      
      const result = search
          ? await pool.query(dataQuery.replace('$3', '$3'), [limit, offset, `%${search}%`])
          : await pool.query(dataQuery.replace(searchFilter, ''), [limit, offset]);
  
	const data: AuctionListItem[] = result.rows.map((row: QueryResult['rows'][0]) => ({
		id: row.id as number,
		product_id: row.product_id as number,
		product_name: row.title as string, 
		image: row.image as string | null, 
		store_name: row.store_name as string,
		starting_price: parseFloat(row.starting_price as string),
		current_price: row.current_price ? parseFloat(row.current_price as string) : parseFloat(row.starting_price as string),
		min_increment: parseFloat(row.min_increment as string),
		start_time: row.start_time as string,
		end_time: row.end_time as string | null,
		status: row.status as 'scheduled' | 'active' | 'ended' | 'cancelled', 
		bid_count: parseInt(row.bid_count as string || '0'),
		winner_name: row.winner_name as string | null
	}));
  
      return { data, total };
  }

  async findAllActiveAuctions(): Promise<Auction[]> {
    const result = await pool.query(`SELECT * FROM auctions WHERE status = 'active'`);
    return result.rows;
  }

  // Update auction status
  async updateAuctionStatus(auctionId: number, newStatus: 'scheduled' | 'active' | 'ended' | 'cancelled'): Promise<Auction | null> {
    const result = await pool.query(`
      UPDATE auctions 
      SET status = $1
      WHERE auction_id = $2
      RETURNING *
    `, [newStatus, auctionId]);

	console.log(result.rows[0]);
    
    return result.rows[0] || null;
  }

  // Find scheduled auctions that should be activated (start_time has passed)
  async findScheduledToActivate(): Promise<Auction[]> {
    const result = await pool.query(`
      SELECT * FROM auctions 
      WHERE status = 'scheduled' AND start_time <= NOW()
    `);
    return result.rows;
  }

  // Get active auctions for timer display
  async getActiveAuctionsForTimers(): Promise<{ auction_id: number; end_time: string; status: string }[]> {
    const result = await pool.query(`
      SELECT auction_id, end_time, status
      FROM auctions
      WHERE status = 'active' AND end_time > NOW()
    `);
    return result.rows;
  }

  // Get auction for bidding with FOR UPDATE lock
  async getAuctionForBiddingWithClient(client: any, auctionId: number): Promise<{
    auction_id: number;
    current_price: number;
    min_increment: number;
    winner_id: number | null;
  } | null> {
    const result = await client.query(
      'SELECT auction_id, current_price, min_increment, winner_id FROM auctions WHERE auction_id = $1 FOR UPDATE',
      [auctionId]
    );
    return result.rows[0] || null;
  }

  // Insert new bid
  async insertBidWithClient(client: any, auctionId: number, userId: number, bidAmount: number): Promise<number> {
    const result = await client.query(
      'INSERT INTO auction_bids (auction_id, bidder_id, bid_amount, bid_time) VALUES ($1, $2, $3, NOW()) RETURNING bid_id',
      [auctionId, userId, bidAmount]
    );
    return result.rows[0].bid_id;
  }

  // Update auction current price and winner
  async updateAuctionBidWithClient(client: any, auctionId: number, newPrice: number, winnerId: number): Promise<void> {
    await client.query(
      'UPDATE auctions SET current_price = $1, winner_id = $2 WHERE auction_id = $3',
      [newPrice, winnerId, auctionId]
    );
  }
}

export default new AuctionRepository();