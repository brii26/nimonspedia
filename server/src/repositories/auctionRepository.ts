import pool from '../config/database.js';
import orderRepository from './orderRepository.js';
import { QueryResult } from 'pg';

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
}

interface Bid {
  bid_id: number;
  auction_id: number;
  bidder_id: number;
  bid_amount: number;
  bid_time: string;
  bidder_name?: string;
}

interface BidResult {
  success: boolean;
  message?: string;
  bid_id?: number;
}

class AuctionRepository {
  
  async getAuctionById(auctionId: number): Promise<Auction | null> {
    const result = await pool.query(`
      SELECT 
        a.*,
        u.name as winner_name,
        p.product_name,
        p.store_id,
        s.user_id AS owner_id
      FROM auctions a
      LEFT JOIN users u ON a.winner_id = u.user_id
      LEFT JOIN products p ON a.product_id = p.product_id
      LEFT JOIN stores s ON p.store_id = s.store_id
      WHERE a.auction_id = $1
    `, [auctionId]);
    
    return result.rows[0] || null;
  }

  async placeBid(auctionId: number, userId: number, amount: number): Promise<BidResult> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check auction exists and is active
      const auctionResult = await client.query(`
        SELECT * FROM auctions 
        WHERE auction_id = $1 AND status = 'active' AND start_time <= NOW()
        AND (end_time IS NULL OR end_time > NOW())
      `, [auctionId]);

      if (auctionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'Auction tidak aktif atau sudah berakhir' };
      }

      const auction = auctionResult.rows[0];

      // Validate bid amount (harus lebih dari current_price + min_increment)
      const minimumBid = auction.current_price + auction.min_increment;
      if (amount < minimumBid) {
        await client.query('ROLLBACK');
        return { 
          success: false, 
          message: `Bid minimum Rp ${minimumBid.toLocaleString('id-ID')}` 
        };
      }

      // Check user balance (assuming there's a balance check)
      const userResult = await client.query(
        'SELECT balance FROM users WHERE user_id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'User tidak ditemukan' };
      }

      const userBalance = userResult.rows[0].balance || 0;
      if (userBalance < amount) {
        await client.query('ROLLBACK');
        return { success: false, message: 'Saldo tidak mencukupi' };
      }

      // Insert bid record
      const bidResult = await client.query(`
        INSERT INTO auction_bids (auction_id, bidder_id, bid_amount, bid_time)
        VALUES ($1, $2, $3, NOW())
        RETURNING bid_id
      `, [auctionId, userId, amount]);

      const bidId = bidResult.rows[0].bid_id;

      // Update auction with new current price
      await client.query(`
        UPDATE auctions 
        SET current_price = $1
        WHERE auction_id = $2
      `, [amount, auctionId]);

      await client.query('COMMIT');
      
      return { 
        success: true, 
        message: 'Bid berhasil ditempatkan',
        bid_id: bidId
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Place bid error:', error);
      return { success: false, message: 'Gagal memasang bid' };
    } finally {
      client.release();
    }
  }

  async extendAuction(auctionId: number, newEndTime: Date): Promise<QueryResult> {
    return await pool.query(`
      UPDATE auctions 
      SET end_time = $1, updated_at = NOW()
      WHERE auction_id = $2
    `, [newEndTime, auctionId]);
  }

  async endAuction(auctionId: number): Promise<QueryResult> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Cari pemenang (Highest Bidder)
      const highestBidResult = await client.query(`
        SELECT bidder_id, bid_amount
        FROM auction_bids 
        WHERE auction_id = $1 
        ORDER BY bid_amount DESC, bid_time ASC 
        LIMIT 1
      `, [auctionId]);

      let winnerId: number | null = null;
      let finalPrice = 0;

      if (highestBidResult.rows.length > 0) {
        winnerId = highestBidResult.rows[0].bidder_id;
        finalPrice = Number(highestBidResult.rows[0].bid_amount);
      }

      // 2. Update status Auction menjadi 'ended'
      const result = await client.query(`
        UPDATE auctions 
        SET status = 'ended', 
            end_time = NOW(),
            winner_id = $1,
            current_price = $2
        WHERE auction_id = $3
      `, [winnerId, finalPrice, auctionId]);

      // 3. LOGIKA ORDER OTOMATIS
      if (winnerId) {
        const infoQuery = await client.query(`
            SELECT 
                p.product_id, 
                p.store_id, 
                u.address as shipping_address,
                a.quantity
            FROM auctions a
            JOIN products p ON a.product_id = p.product_id
            JOIN users u ON u.user_id = $1
            WHERE a.auction_id = $2
        `, [winnerId, auctionId]);

        if (infoQuery.rows.length > 0) {
          const info = infoQuery.rows[0];

          // A. Susun Data Order (Header)
          const orderData = {
            buyer_id: winnerId,
            store_id: info.store_id,
            total_price: finalPrice,
            shipping_address: info.shipping_address || '-'
          };

          // B. Susun Data Item (Detail)
          const orderItems = [{
            product_id: info.product_id,
            quantity: info.quantity,
            price: info.quantity > 0 ? Math.floor(finalPrice / info.quantity) : finalPrice,
            subtotal: finalPrice
          }];

          // C. Panggil OrderRepository dengan Client Transaksi
          await orderRepository.createOrder(orderData, orderItems, client);
          
          console.log(`Order created successfully for Auction #${auctionId}`);
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
}

export default new AuctionRepository();