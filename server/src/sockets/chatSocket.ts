import { Server, Socket } from 'socket.io';
import chatRepository from '../repositories/chatRepository.js';
import featureFlagRepository from '../repositories/featureFlagRepository.js';
import { SendMessagePayload, TypingPayload } from '../types/socket-payloads.js';
import { AuthenticatedSocket } from '../types/socket.js';

export default (io: Server, socket: AuthenticatedSocket) => {
  const user = socket.user;

  // 1. Setup Room Pribadi
  // Room ini namanya "user_123". Cuma user 123 yang join room ini.
  // Orang lain kalau mau kirim pesan ke 123, kirim event ke room "user_123".
  const myRoom = `user_${user.user_id}`;
  socket.join(myRoom);

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

      const savedMessage = await chatRepository.saveMessage(
        user.user_id, 
        payload.receiverId, 
        payload.message
      );

      // --- BROADCAST: Kirim ke Penerima ---
      // Kirim event ke room "user_{id_penerima}"
      const targetRoom = `user_${payload.receiverId}`;
      io.to(targetRoom).emit('incoming_message', savedMessage);

      // --- FEEDBACK: Centang 2 (biar UI update real-time juga) ---
      socket.emit('message_sent', savedMessage);

    } catch (error) {
      console.error('Chat Error:', error);
      socket.emit('error_message', { message: 'Gagal mengirim pesan.' });
    }
  });

  // 3. Handle Typing Indicator
  socket.on('typing', (payload: TypingPayload) => {
    // cuma perlu terusin sinyal ini ke room lawan bicara
    const targetRoom = `user_${payload.receiverId}`;
    
    io.to(targetRoom).emit('partner_typing', {
      senderId: user.user_id,
      isTyping: true
    });
  });

  socket.on('stop_typing', (payload: TypingPayload) => {
    const targetRoom = `user_${payload.receiverId}`;
    io.to(targetRoom).emit('partner_typing', {
      senderId: user.user_id,
      isTyping: false
    });
  });
};