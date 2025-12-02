// server/src/routes/authRoutes.ts
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '../middleware/authMiddleware.js';

export default async function authRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {

  // GET /auth/user
  // Endpoint ini dipanggil oleh React AuthContext untuk cek session PHP
  fastify.get('/user', {
    preHandler: requireAuth // Middleware ini akan membaca cookie PHPSESSID
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    
    // request.user otomatis diisi oleh middleware requireAuth
    return {
      success: true,
      user: request.user
    };
  });

}