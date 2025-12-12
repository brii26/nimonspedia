import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '../middleware/authMiddleware.js';
import auctionController from '../controllers/auctionController.js';

export default async function auctionRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {

  // Get all unique participants (bidders) for an auction
  fastify.get('/:id/participants', {
    preHandler: requireAuth
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return auctionController.getAuctionParticipants(request, reply);
  });

  fastify.get('/list', async (request: FastifyRequest, reply: FastifyReply) => {
    return auctionController.getAuctionList(request, reply);
  });

  fastify.post('/place-bid', {
    preHandler: requireAuth
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return auctionController.placeBid(request, reply);
  });

  fastify.get('/user/balance', {
    preHandler: requireAuth
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return auctionController.getUserBalance(request, reply);
  });

  fastify.get('/timers', async (request: FastifyRequest, reply: FastifyReply) => {
    return auctionController.getTimers(request, reply);
  });
}
