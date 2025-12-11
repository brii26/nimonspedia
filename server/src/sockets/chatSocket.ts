import { Server, Socket } from 'socket.io';
import pool from '../config/database.js';
import chatRepository from '../repositories/chatRepository.js';
import featureFlagRepository from '../repositories/featureFlagRepository.js';
import { SendMessagePayload, TypingPayload } from '../types/socket-payloads.js';
import { AuthenticatedSocket } from '../types/socket.js';
import validator from 'validator';
import escapeHtml from 'escape-html';


const isChatEnabled = async (userId: number): Promise<{ allowed: boolean; reason?: string }> => {
  const featureName = 'chat_enabled';
  
  // 1. Cek Global Flag
  const globalFlag = await featureFlagRepository.getGlobalFlag(featureName);
  // Asumsi: Jika global flag record tidak ada/null, default behavior biasanya FALSE (Maintenance) atau TRUE tergantung default DB.
  // Jika mengikuti middleware Anda sebelumnya: "if (!globalFlags) return 503".
  if (globalFlag && !globalFlag.is_enabled) {
    return { allowed: false, reason: globalFlag.reason || 'System Maintenance' };
  }

  // 2. Cek User Flag
  const userFlag = await featureFlagRepository.getUserFlag(userId, featureName);
  if (userFlag && !userFlag.is_enabled) {
    return { allowed: false, reason: userFlag.reason || 'Feature disabled for your account' };
  }

  return { allowed: true };
};

export default (io: Server, socket: AuthenticatedSocket) => {
  const user = socket.user;

  // Auto-join user's personal notification room
  const userRoom = `user_${user.user_id}`;
  socket.join(userRoom);
  console.log(`User ${user.name} joined notification room: ${userRoom}`);

  // 1. Setup Room Logic
  // Chat rooms berbasis store-buyer: "chat_{storeId}_{buyerId}"
  // User bisa join multiple rooms tergantung role dan chat yang aktif

  // Handle explicit join_user_channel if needed (legacy support)
  socket.on('join_user_channel', (payload: { user_id: number }) => {
    const room = `user_${payload.user_id}`;
    socket.join(room);
    console.log(`User explicitly joined room: ${room}`);
  });

  // 2. Handle Event Join Chat Room
  socket.on('join_chat', async (payload: { storeId: number; buyerId?: number }) => {
    try {
      const access = await isChatEnabled(user.user_id);
      if (!access.allowed) {
        socket.emit('chat_error', { message: `Fitur Chat nonaktif: ${access.reason}` });
        return;
      }
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

      // Mark messages as read AFTER joining
      await chatRepository.markAsRead(storeId, buyerId, user.user_id);
      
      // Broadcast read status to ALL in room (including self)
      io.to(chatRoom).emit('messages_read', {
        storeId,
        buyerId,
        readBy: user.user_id,
        timestamp: new Date().toISOString()
      });
      
      console.log(`[Read Receipt] Broadcasted to room ${chatRoom} - read by user ${user.user_id}`);

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
      const access = await isChatEnabled(user.user_id);
      if (!access.allowed) {
        socket.emit('chat_error', { 
          message: `Gagal kirim. Fitur Chat nonaktif: ${access.reason}` 
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
             socket.emit('chat_error', { message: 'Target Store ID diperlukan' });
             return;
        }

      } else if (user.role === 'SELLER') {
        // Jika pengirim adalah Seller:
        // - storeId divalidasi dari DB (apakah dia pemilik toko?)
        // - buyerId diambil dari payload (siapa customer yang dibalas)
        const storeResult = await pool.query('SELECT store_id FROM stores WHERE user_id = $1', [user.user_id]);
        if (storeResult.rows.length === 0) {
          socket.emit('chat_error', { message: 'Anda tidak memiliki toko' });
          return;
        }
        
        // Override storeId payload dengan storeId asli milik user (security)
        storeId = storeResult.rows[0].store_id;

        if (!buyerId) {
            socket.emit('chat_error', { message: 'Target Buyer ID diperlukan' });
            return;
        }
      } else {
        socket.emit('chat_error', { message: 'Role tidak valid' });
        return;
      }

      // 3. Validasi & Sanitasi Konten
      const msgType = payload.type || 'text';
      let msgContent = payload.message;
      let productId = payload.productId || null;

      // Validasi panjang pesan (max 5000 karakter)
      if (msgType === 'text') {
        if (!msgContent || !msgContent.trim()) return;
        if (msgContent.length > 5000) {
          socket.emit('chat_error', { message: 'Pesan terlalu panjang (max 5000 karakter)' });
          return;
        }
        // Sanitize HTML untuk prevent XSS
        msgContent = escapeHtml(msgContent.trim());
      }

      // Validasi untuk item_preview
      if (msgType === 'item_preview' && !productId) {
        socket.emit('chat_error', { message: 'Product ID required for item preview' });
        return;
      }

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

      // 7. Send Push Notification to receiver (only if not in chat room)
      const receiverId = savedMessage.sender_id === buyerId ? 
        (await pool.query('SELECT user_id FROM stores WHERE store_id = $1', [storeId])).rows[0]?.user_id :
        buyerId;
      
      if (receiverId) {
        try {
          const senderName = user.name || 'Someone';
          const messagePreview = msgType === 'text' ? 
            (msgContent.length > 100 ? msgContent.substring(0, 100) + '...' : msgContent) :
            msgType === 'image' ? '📷 Image' : '🏷️ Product Preview';
          
          // Check if receiver is in the chat room
          const socketsInRoom = await io.in(chatRoom).fetchSockets();
          const receiverInRoom = socketsInRoom.some(s => (s as any).user?.user_id === receiverId);
          
          console.log(`[Notification] Receiver ${receiverId} in room ${chatRoom}:`, receiverInRoom);
          
          // Only send notification if receiver is NOT in the room
          if (!receiverInRoom) {
            io.to(`user_${receiverId}`).emit('new_chat_notification', {
              title: `New message from ${senderName}`,
              body: messagePreview,
              data: {
                type: 'chat',
                storeId,
                buyerId,
                url: `/chat?storeId=${storeId}&buyerId=${buyerId}`
              }
            });
            console.log(`[Notification] Sent to user_${receiverId}`);
          } else {
            console.log(`[Notification] Skipped - receiver is in chat room`);
          }
        } catch (notifError) {
          console.error('Push notification error:', notifError);
        }
      }

    } catch (error) {
      console.error('Chat Error:', error);
      socket.emit('chat_error', { message: 'Gagal mengirim pesan.' });
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

  // Handle mark messages as read (manual trigger)
  socket.on('mark_as_read', async (payload: { storeId: number; buyerId?: number }) => {
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
        
        // Mark as read in database
        await chatRepository.markAsRead(storeId, buyerId, user.user_id);
        
        // Broadcast to all in room
        io.to(chatRoom).emit('messages_read', {
          storeId,
          buyerId,
          readBy: user.user_id,
          timestamp: new Date().toISOString()
        });
        
        console.log(`[Manual Read Receipt] User ${user.user_id} marked messages as read in ${chatRoom}`);
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  });

  // 4. Handle Get Chat History
  socket.on('get_chat_history', async (payload: { storeId: number; buyerId?: number; limit?: number }) => {
    const access = await isChatEnabled(user.user_id);
      if (!access.allowed) {
        socket.emit('chat_error', { message: 'Fitur Chat sedang dinonaktifkan.' });
        return;
      }
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
    const access = await isChatEnabled(user.user_id);
    if (!access.allowed) {
        socket.emit('chat_error', { message: 'Fitur Chat sedang dinonaktifkan.' });
        return;
    }

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
      
      socket.emit('more_messages_loaded', { 
        storeId, 
        buyerId, 
        messages,
        hasMore: messages.length === limit 
      });

    } catch (error) {
      console.error('Load More Error:', error);
    }
  });
};