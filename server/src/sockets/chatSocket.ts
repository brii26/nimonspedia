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
  socket.on('send_message', async (payload: { 
      storeId: number; 
      buyerId?: number; 
      message: string; 
      type?: 'text' | 'image' | 'item_preview';
      productId?: number;
  }) => {
    try {
      // 1. Cek Feature Flag (Tetap dipertahankan)
      const flagAccess = await featureFlagRepository.getUserFlag(user.user_id, 'chat_enabled');
      if (flagAccess && flagAccess.is_enabled === false) {
        socket.emit('error_message', { 
          message: `Fitur Chat nonaktif: ${flagAccess.reason || 'Maintenance'}` 
        });
        return;
      }

      // 2. Validasi & Penentuan Context
      let storeId = payload.storeId;
      let buyerId = payload.buyerId;

      if (user.role === 'BUYER') {
        // Jika pengirim adalah Buyer:
        // - buyerId otomatis adalah dirinya sendiri (security)
        // - storeId diambil dari payload (siapa yang diajak chat)
        buyerId = user.user_id;
        
        if (!storeId) {
             socket.emit('error_message', { message: 'Target Store ID diperlukan' });
             return;
        }

      } else if (user.role === 'SELLER') {
        // Jika pengirim adalah Seller:
        // - storeId divalidasi dari DB (apakah dia pemilik toko?)
        // - buyerId diambil dari payload (siapa customer yang dibalas)
        const storeResult = await pool.query('SELECT store_id FROM stores WHERE user_id = $1', [user.user_id]);
        if (storeResult.rows.length === 0) {
          socket.emit('error_message', { message: 'Anda tidak memiliki toko' });
          return;
        }
        
        // Override storeId payload dengan storeId asli milik user (security)
        storeId = storeResult.rows[0].store_id;

        if (!buyerId) {
            socket.emit('error_message', { message: 'Target Buyer ID diperlukan' });
            return;
        }
      } else {
        socket.emit('error_message', { message: 'Role tidak valid' });
        return;
      }

      // 3. Validasi Konten (Sama seperti sebelumnya)
      const msgType = payload.type || 'text';
      let msgContent = payload.message;
      let productId = payload.productId || null;

      if (msgType === 'text' && (!msgContent || !msgContent.trim())) return;

      // 4. Simpan ke Database
      const savedMessage = await chatRepository.saveMessage(
        storeId,
        buyerId, 
        user.user_id, // Sender ID
        msgContent,
        msgType, 
        productId
      );

      // 5. Broadcast (Standardized Event Name: 'new_message')
      const chatRoom = `chat_${storeId}_${buyerId}`;
      
      io.to(chatRoom).emit('new_message', {
        ...savedMessage,
        room_id: chatRoom // Tambahkan ini agar Client validasi mudah
      });

      // 6. Feedback ke Sender
      socket.emit('message_sent', savedMessage);

    } catch (error) {
      console.error('Chat Error:', error);
      socket.emit('error_message', { message: 'Gagal mengirim pesan.' });
    }
  });

  // 3. Handle Typing Indicator
  // 3. Handle Typing Indicator
  socket.on('typing', async (payload: { storeId: number; buyerId?: number }) => {
    try {
      let { storeId, buyerId } = payload;

      // Logic penentuan room (Sama seperti send_message)
      if (user.role === 'BUYER') {
        buyerId = user.user_id;
      } else if (user.role === 'SELLER') {
        const storeResult = await pool.query('SELECT store_id FROM stores WHERE user_id = $1', [user.user_id]);
        if (storeResult.rows.length === 0) return;
        storeId = storeResult.rows[0].store_id;
      }

      if (storeId && buyerId) {
        const chatRoom = `chat_${storeId}_${buyerId}`;
        socket.to(chatRoom).emit('partner_typing', {
          senderId: user.user_id,
          senderName: user.name,
          isTyping: true
        });
      }
    } catch (error) {
      console.error('Typing Error:', error);
    }
  });

  socket.on('stop_typing', async (payload: { storeId: number; buyerId?: number }) => {
    try {
      let { storeId, buyerId } = payload;

      if (user.role === 'BUYER') {
        buyerId = user.user_id;
      } else if (user.role === 'SELLER') {
        const storeResult = await pool.query('SELECT store_id FROM stores WHERE user_id = $1', [user.user_id]);
        if (storeResult.rows.length === 0) return;
        storeId = storeResult.rows[0].store_id;
      }

      if (storeId && buyerId) {
        const chatRoom = `chat_${storeId}_${buyerId}`;
        socket.to(chatRoom).emit('partner_typing', {
          senderId: user.user_id,
          senderName: user.name,
          isTyping: false
        });
      }
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

  socket.on('load_more_messages', async (payload: { storeId: number; buyerId?: number; beforeId: number; limit?: number }) => {
    try {
      let { storeId, buyerId, beforeId, limit = 50 } = payload;

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

      const messages = await chatRepository.getChatHistory(storeId, buyerId!, limit, beforeId);
      
      // Emit event khusus agar client tau ini pesan lama
      socket.emit('more_messages_loaded', { 
        storeId, 
        buyerId, 
        messages,
        hasMore: messages.length === limit // Flag untuk client tahu masih ada sisa atau tidak
      });

    } catch (error) {
      console.error('Load More Error:', error);
    }
  });

  // 5. Handle Disconnect
  socket.on('disconnect', () => {
    console.log(`User ${user.name} disconnected from chat socket`);
  });
};