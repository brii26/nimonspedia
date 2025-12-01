import pool from '../config/database.js'; 
import { ChatMessage } from '../types/socket-payloads.js';

interface ChatMessageDB {
  message_id: number;
  store_id: number;
  buyer_id: number;
  sender_id: number;
  message_type: 'text' | 'image' | 'item_preview';
  content: string;
  product_id?: number;
  is_read: boolean;
  created_at: string;
}

interface ChatRoom {
  store_id: number;
  buyer_id: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

class ChatRepository {

  // Ensure chat room exists
  async ensureChatRoom(storeId: number, buyerId: number): Promise<void> {
    const query = `
      INSERT INTO chat_rooms (store_id, buyer_id, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (store_id, buyer_id) DO NOTHING
    `;
    await pool.query(query, [storeId, buyerId]);
  }

  async saveMessage(storeId: number, buyerId: number, senderId: number, message: string): Promise<ChatMessageDB> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Ensure chat room exists
      await client.query(`
        INSERT INTO chat_rooms (store_id, buyer_id, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (store_id, buyer_id) DO NOTHING
      `, [storeId, buyerId]);

      // Insert message
      const messageQuery = `
        INSERT INTO chat_messages (store_id, buyer_id, sender_id, message_type, content, created_at)
        VALUES ($1, $2, $3, 'text', $4, NOW())
        RETURNING *
      `;
      const messageRes = await client.query(messageQuery, [storeId, buyerId, senderId, message]);

      // Update last_message_at in chat room
      await client.query(`
        UPDATE chat_rooms 
        SET last_message_at = NOW(), updated_at = NOW()
        WHERE store_id = $1 AND buyer_id = $2
      `, [storeId, buyerId]);

      await client.query('COMMIT');
      return messageRes.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get chat history between store and buyer
  async getChatHistory(storeId: number, buyerId: number, limit: number = 50): Promise<ChatMessageDB[]> {
    const query = `
      SELECT * FROM chat_messages 
      WHERE store_id = $1 AND buyer_id = $2
      ORDER BY created_at DESC
      LIMIT $3
    `;
    const res = await pool.query(query, [storeId, buyerId, limit]);
    return res.rows.reverse(); // Return in chronological order
  }

  // Get all chat rooms for a user (either as buyer or store owner)
  async getChatRoomsForUser(userId: number): Promise<any[]> {
    const query = `
      SELECT 
        cr.*,
        s.store_name,
        s.store_logo_path,
        u.name as buyer_name,
        cm.content as last_message,
        cm.created_at as last_message_time
      FROM chat_rooms cr
      JOIN stores s ON cr.store_id = s.store_id
      JOIN users u ON cr.buyer_id = u.user_id
      LEFT JOIN LATERAL (
        SELECT content, created_at
        FROM chat_messages 
        WHERE store_id = cr.store_id AND buyer_id = cr.buyer_id
        ORDER BY created_at DESC
        LIMIT 1
      ) cm ON true
      WHERE s.user_id = $1 OR cr.buyer_id = $1
      ORDER BY cr.last_message_at DESC NULLS LAST
    `;
    const res = await pool.query(query, [userId]);
    return res.rows;
  }

  // Mark messages as read
  async markAsRead(storeId: number, buyerId: number, userId: number): Promise<void> {
    const query = `
      UPDATE chat_messages 
      SET is_read = true
      WHERE store_id = $1 AND buyer_id = $2 AND sender_id != $3 AND is_read = false
    `;
    await pool.query(query, [storeId, buyerId, userId]);
  }

  // Get unread count for user
  async getUnreadCount(userId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as unread_count
      FROM chat_messages cm
      JOIN chat_rooms cr ON cm.store_id = cr.store_id AND cm.buyer_id = cr.buyer_id
      JOIN stores s ON cr.store_id = s.store_id
      WHERE cm.is_read = false 
      AND cm.sender_id != $1
      AND (s.user_id = $1 OR cr.buyer_id = $1)
    `;
    const res = await pool.query(query, [userId]);
    return parseInt(res.rows[0].unread_count) || 0;
  }
}

export default new ChatRepository();