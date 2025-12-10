import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '../middleware/authMiddleware.js';
import auctionController from '../controllers/auctionController.js';

export default async function auctionRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {

  // POST /auctions/place-bid
  // Place a bid on an auction
  fastify.post('/place-bid', {
    preHandler: requireAuth
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return auctionController.placeBid(request, reply);
  });

  // GET /auctions/user/balance
  // Get current user's balance
  fastify.get('/user/balance', {
    preHandler: requireAuth
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return auctionController.getUserBalance(request, reply);
  });
}
