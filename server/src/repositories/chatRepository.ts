import pool from '../config/database'; 
import { ChatMessage } from '../types/socket-payloads';

class ChatRepository {
  async saveMessage(senderId: number, receiverId: number, message: string): Promise<ChatMessage> {
    const query = `
      INSERT INTO chats (sender_id, receiver_id, message, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    const res = await pool.query(query, [senderId, receiverId, message]);
    return res.rows[0];
  }

  // Update status 'read'
  async markAsRead(messageId: number) {
    // Logic update db...
  }
}

export default new ChatRepository();