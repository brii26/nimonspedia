// server/src/routes/authRoutes.ts
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '../middleware/authMiddleware.js';
import userRepository from '../repositories/userRepository.js';

export default async function authRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {

  // GET /auth/user
  // Endpoint ini dipanggil oleh React AuthContext untuk cek session PHP
  fastify.get('/user', {
    preHandler: requireAuth // Middleware ini akan membaca cookie PHPSESSID
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    
    try {
      let userId = (request.user as any)?.user_id;
      
      if (userId) {
        userId = parseInt(userId, 10);
      }

      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: 'Not authenticated'
        });
      }

      const user = await userRepository.findById(userId.toString());

      if (!user) {
        return reply.status(404).send({
          success: false,
          message: 'User not found'
        });
      }

      return reply.send({
        success: true,
        user: {
          id: user.user_id,
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
          balance: user.balance || 0
        }
      });

    } catch (error: any) {
      console.error('[Auth/User] Error:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch user'
      });
    }
  });

}