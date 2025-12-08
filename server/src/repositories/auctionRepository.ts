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

interface BidResult {
  success: boolean;
  message?: string;
  bid_id?: number;
}

class AuctionRepository {
  
  // Get Auction By ID (Detail Page)
  async getAuctionById(auctionId: number): Promise<Auction | null> {
    const result = await pool.query(`
      SELECT 
        a.*,
        u.name as winner_name,
        p.product_name,
        p.store_id,
        p.main_image_path AS image,
        s.user_id AS owner_id
      FROM auctions a
      LEFT JOIN users u ON a.winner_id = u.user_id
      LEFT JOIN products p ON a.product_id = p.product_id
      LEFT JOIN stores s ON p.store_id = s.store_id
      WHERE a.auction_id = $1
    `, [auctionId]);
    
    return result.rows[0] || null;
  }

  // Place Bid
  async placeBid(auctionId: number, userId: number, amount: number): Promise<BidResult> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const auctionResult = await client.query(`
        SELECT * FROM auctions 
        WHERE auction_id = $1 AND status = 'active' AND start_time <= NOW()
        AND (end_time IS NULL OR end_time > NOW()) FOR UPDATE
      `, [auctionId]);

      if (auctionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'Auction tidak aktif atau sudah berakhir' };
      }

      const auction = auctionResult.rows[0];
      const minimumBid = Number(auction.current_price) + Number(auction.min_increment);
      
      if (amount < minimumBid) {
        await client.query('ROLLBACK');
        return { success: false, message: `Bid minimum Rp ${minimumBid.toLocaleString('id-ID')}` };
      }

      const userResult = await client.query('SELECT balance FROM users WHERE user_id = $1', [userId]);
      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'User tidak ditemukan' };
      }

      if (Number(userResult.rows[0].balance) < amount) {
        await client.query('ROLLBACK');
        return { success: false, message: 'Saldo tidak mencukupi' };
      }

      const bidResult = await client.query(`
        INSERT INTO auction_bids (auction_id, bidder_id, bid_amount, bid_time)
        VALUES ($1, $2, $3, NOW())
        RETURNING bid_id
      `, [auctionId, userId, amount]);

      await client.query(`
        UPDATE auctions SET current_price = $1 WHERE auction_id = $2
      `, [amount, auctionId]);

      await client.query('COMMIT');
      return { success: true, message: 'Bid berhasil', bid_id: bidResult.rows[0].bid_id };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Place bid error:', error);
      return { success: false, message: 'Gagal memasang bid' };
    } finally {
      client.release();
    }
  }

  // Extend Auction
  async extendAuction(auctionId: number, newEndTime: Date): Promise<QueryResult> {
    return await pool.query(`
      UPDATE auctions SET end_time = $1, updated_at = NOW() WHERE auction_id = $2
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
  async getAuctionsPaginated(page: number, limit: number, filter: 'active' | 'scheduled'): Promise<{ data: AuctionListItem[], total: number }> {
      const offset = (page - 1) * limit;
  
      let statusFilter = '';
      if (filter === 'active') {
          statusFilter = "WHERE a.status = 'active' AND a.end_time > NOW()";
      } else if (filter === 'scheduled') { 
          statusFilter = "WHERE a.status = 'scheduled'"; 
      } else {
          statusFilter = "WHERE a.status = 'active' AND a.end_time > NOW()";
      }
  
      // Query Count
      const countQuery = await pool.query(`SELECT COUNT(*) FROM auctions a ${statusFilter}`);
      const total = parseInt(countQuery.rows[0].count);
  
      // Query Data
      const result = await pool.query(`
          SELECT 
              a.auction_id as id,
              a.product_id,
              a.starting_price,
              a.current_price,
              a.min_increment,
              a.start_time,
              a.end_time,
              a.status,
              p.product_name AS title,
              p.main_image_path AS image,
              s.store_name,
              (SELECT COUNT(*) FROM auction_bids ab WHERE ab.auction_id = a.auction_id) as bid_count
          FROM auctions a
          JOIN products p ON a.product_id = p.product_id
          JOIN stores s ON p.store_id = s.store_id
          ${statusFilter}
          ORDER BY a.start_time ASC
          LIMIT $1 OFFSET $2
      `, [limit, offset]);
  
      const data: AuctionListItem[] = result.rows.map(row => ({
          id: row.id,
          product_id: row.product_id,
          product_name: row.title, 
          image: row.image, 
          store_name: row.store_name,
          starting_price: parseFloat(row.starting_price),
          current_price: row.current_price ? parseFloat(row.current_price) : parseFloat(row.starting_price),
          min_increment: parseFloat(row.min_increment),
          start_time: row.start_time,
          end_time: row.end_time,
          status: row.status, 
          bid_count: parseInt(row.bid_count || '0')
      }));
  
      return { data, total };
  }

  async findAllActiveAuctions(): Promise<Auction[]> {
    const result = await pool.query(`SELECT * FROM auctions WHERE status = 'active'`);
    return result.rows;
  }
}

export default new AuctionRepository();