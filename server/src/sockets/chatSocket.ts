import { Server, Socket } from 'socket.io';
import pool from '../config/database.js';
import chatRepository from '../repositories/chatRepository.js';
import featureFlagRepository from '../repositories/featureFlagRepository.js';
import { SendMessagePayload, TypingPayload } from '../types/socket-payloads.js';
import { AuthenticatedSocket } from '../types/socket.js';

export default (io: Server, socket: AuthenticatedSocket) => {
  const user = socket.user;

  // 1. Setup Room Logic
  // Chat rooms berbasis store-buyer: "chat_{storeId}_{buyerId}"
  // User bisa join multiple rooms tergantung role dan chat yang aktif

  // 2. Handle Event Join Chat Room
  socket.on('join_chat', async (payload: { storeId: number; buyerId?: number }) => {
    try {
      let storeId = payload.storeId;
      let buyerId = payload.buyerId;

      // Validate access
      if (user.role === 'BUYER') {
        buyerId = user.user_id;
      } else if (user.role === 'SELLER') {
        // Verify user owns this store
        const storeResult = await pool.query('SELECT store_id FROM stores WHERE user_id = $1 AND store_id = $2', [user.user_id, storeId]);
        if (storeResult.rows.length === 0) {
          socket.emit('chat_error', { message: 'Tidak memiliki akses ke store ini' });
          return;
        }
        if (!buyerId) {
          socket.emit('chat_error', { message: 'buyerId diperlukan untuk seller' });
          return;
        }
      } else {
        socket.emit('chat_error', { message: 'Role tidak valid untuk chat' });
        return;
      }

      const chatRoom = `chat_${storeId}_${buyerId}`;
      socket.join(chatRoom);
      
      // Ensure chat room exists in database
      await chatRepository.ensureChatRoom(storeId, buyerId);

      const messages = await chatRepository.getChatHistory(storeId, buyerId, 50);
      
      socket.emit('chat_joined', { 
        storeId, 
        buyerId, 
        room: chatRoom,
        messages: messages || []
      });

      console.log(`User ${user.name} joined chat room: ${chatRoom}`);

    } catch (error) {
      console.error('Join Chat Error:', error);
      socket.emit('chat_error', { message: 'Gagal join chat room' });
    }
  });

  // 2. Handle Event Kirim Pesan
  socket.on('send_message', async (payload: SendMessagePayload) => {
    try {
      const flagAccess = await featureFlagRepository.getUserFlag(user.user_id, 'chat_enabled');
      // Logic: Jika flag ada DAN is_enabled false, maka tolak.
      if (flagAccess && flagAccess.is_enabled === false) {
        socket.emit('error_message', { 
          message: `Fitur Chat nonaktif: ${flagAccess.reason || 'Maintenance'}` 
        });
        return;
      }

      if (!payload.message || !payload.message.trim()) return;

      // Determine storeId and buyerId based on user role
      let storeId: number;
      let buyerId: number;
      
      if (user.role === 'BUYER') {
        // Buyer mengirim pesan ke store
        storeId = payload.receiverId; // receiverId adalah storeId
        buyerId = user.user_id;
      } else if (user.role === 'SELLER') {
        // Seller mengirim pesan ke buyer
        // Perlu query untuk mendapat storeId dari userId
        const storeResult = await pool.query('SELECT store_id FROM stores WHERE user_id = $1', [user.user_id]);
        if (storeResult.rows.length === 0) {
          socket.emit('error_message', { message: 'Store tidak ditemukan' });
          return;
        }
        storeId = storeResult.rows[0].store_id;
        buyerId = payload.receiverId; // receiverId adalah buyerId
      } else {
        socket.emit('error_message', { message: 'Role tidak valid untuk chat' });
        return;
      }

      const msgType = payload.type || 'text';
      let msgContent = payload.message;
      let productId = payload.productId || null;

      if (msgType === 'text' && (!msgContent || !msgContent.trim())) {
        return;
      }

      if (msgType === 'image') {
        // Asumsi: Content berisi URL gambar (hasil upload API)
        if (!msgContent) {
          socket.emit('error_message', { message: 'URL Gambar tidak boleh kosong' });
          return;
        }
      }

      if (msgType === 'item_preview') {
        if (!productId) {
          socket.emit('error_message', { message: 'Product ID diperlukan untuk item preview' });
          return;
        }
        // Content bisa optional untuk preview, atau berisi pesan pengantar
        if (!msgContent) msgContent = ''; 
      }

      const savedMessage = await chatRepository.saveMessage(
        storeId,
        buyerId, 
        user.user_id,
        msgContent,
        msgType, 
        productId
      );

      // --- BROADCAST: Kirim ke room chat ini ---
      const chatRoom = `chat_${storeId}_${buyerId}`;
      io.to(chatRoom).emit('incoming_message', savedMessage);

      // --- FEEDBACK: Konfirmasi ke sender ---
      socket.emit('message_sent', savedMessage);

    } catch (error) {
      console.error('Chat Error:', error);
      socket.emit('error_message', { message: 'Gagal mengirim pesan.' });
    }
  });

  // 3. Handle Typing Indicator
  socket.on('typing', async (payload: TypingPayload) => {
    try {
      // Determine chat room based on role
      let storeId: number;
      let buyerId: number;
      
      if (user.role === 'BUYER') {
        storeId = payload.receiverId; // receiverId adalah storeId
        buyerId = user.user_id;
      } else if (user.role === 'SELLER') {
        const storeResult = await pool.query('SELECT store_id FROM stores WHERE user_id = $1', [user.user_id]);
        if (storeResult.rows.length === 0) return;
        storeId = storeResult.rows[0].store_id;
        buyerId = payload.receiverId; // receiverId adalah buyerId
      } else {
        return;
      }

      const chatRoom = `chat_${storeId}_${buyerId}`;
      socket.to(chatRoom).emit('partner_typing', {
        senderId: user.user_id,
        senderName: user.name,
        isTyping: true
      });
    } catch (error) {
      console.error('Typing Error:', error);
    }
  });

  socket.on('stop_typing', async (payload: TypingPayload) => {
    try {
      // Same logic as typing
      let storeId: number;
      let buyerId: number;
      
      if (user.role === 'BUYER') {
        storeId = payload.receiverId;
        buyerId = user.user_id;
      } else if (user.role === 'SELLER') {
        const storeResult = await pool.query('SELECT store_id FROM stores WHERE user_id = $1', [user.user_id]);
        if (storeResult.rows.length === 0) return;
        storeId = storeResult.rows[0].store_id;
        buyerId = payload.receiverId;
      } else {
        return;
      }

      const chatRoom = `chat_${storeId}_${buyerId}`;
      socket.to(chatRoom).emit('partner_typing', {
        senderId: user.user_id,
        senderName: user.name,
        isTyping: false
      });
    } catch (error) {
      console.error('Stop Typing Error:', error);
    }
  });

  // 4. Handle Get Chat History
  socket.on('get_chat_history', async (payload: { storeId: number; buyerId?: number; limit?: number }) => {
    try {
      let { storeId, buyerId, limit = 50 } = payload;

      // Validate access
      if (user.role === 'BUYER') {
        buyerId = user.user_id;
      } else if (user.role === 'SELLER') {
        const storeResult = await pool.query('SELECT store_id FROM stores WHERE user_id = $1 AND store_id = $2', [user.user_id, storeId]);
        if (storeResult.rows.length === 0) {
          socket.emit('chat_error', { message: 'Tidak memiliki akses ke store ini' });
          return;
        }
      }

      if (!buyerId) {
        socket.emit('chat_error', { message: 'buyerId diperlukan' });
        return;
      }

      const messages = await chatRepository.getChatHistory(storeId, buyerId, limit);
      socket.emit('chat_history', { storeId, buyerId, messages });

      // Mark as read
      await chatRepository.markAsRead(storeId, buyerId, user.user_id);

    } catch (error) {
      console.error('Get Chat History Error:', error);
      socket.emit('chat_error', { message: 'Gagal mengambil history chat' });
    }
  });

  // 5. Handle Disconnect
  socket.on('disconnect', () => {
    console.log(`User ${user.name} disconnected from chat socket`);
  });
};