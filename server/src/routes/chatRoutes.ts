import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '../middleware/authMiddleware.js';
import chatRepo from '../repositories/chatRepository.js';

interface GetMessagesParams {
  roomId: string;
}

interface InitiateChatBody {
  storeId: number;
}

export default async function chatRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {

  // GET Rooms
  fastify.get('/rooms', {
    preHandler: requireAuth
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user!;
      const rooms = await chatRepo.getChatRoomsForUser(Number(user.user_id));
      return { success: true, data: rooms };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Gagal memuat chat rooms' });
    }
  });

  // GET Messages (PERBAIKAN UTAMA: Parse String ID)
  fastify.get<{ Params: GetMessagesParams }>('/messages/:roomId', {
    preHandler: requireAuth
  }, async (request, reply) => {
    try {
      const { roomId } = request.params;

      // Parse "chat_1_2" menjadi storeId=1, buyerId=2
      let storeId: number;
      let buyerId: number;

      if (roomId.startsWith('chat_')) {
        const parts = roomId.split('_');
        storeId = Number(parts[1]);
        buyerId = Number(parts[2]);
      } else {
        return reply.status(400).send({ success: false, message: 'Format ID salah' });
      }

      // Panggil fungsi getChatHistory (bukan getMessagesByRoomId)
      const messages = await chatRepo.getChatHistory(storeId, buyerId);
      
      return { success: true, data: messages };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Gagal memuat pesan' });
    }
  });

  // POST Initiate - Create chat room and return room data
  fastify.post<{ Body: InitiateChatBody }>('/initiate', {
    preHandler: requireAuth
  }, async (request, reply) => {
    try {
      const user = request.user!;
      const { storeId } = request.body;

      if (!storeId) return reply.status(400).send({ success: false, message: 'storeId required' });
      
      // Ensure user is buyer
      if (user.role !== 'BUYER') {
        return reply.status(403).send({ success: false, message: 'Only buyers can initiate chat' });
      }
      
      const room = await chatRepo.initiateChatRoom(Number(storeId), Number(user.user_id));
      
      // Return room_id in format: chat_{store_id}_{buyer_id}
      return reply.send({ 
        success: true, 
        data: {
          ...room,
          room_id: `chat_${room.store_id}_${room.buyer_id}`
        } 
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Gagal inisialisasi chat' });
    }
  });
}