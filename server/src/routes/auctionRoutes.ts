import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '../middleware/authMiddleware.js';
import { checkFeatureFlag } from '../middleware/featureFlagMiddleware.js';
import auctionController from '../controllers/auctionController.js';

export default async function auctionRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {

  const auctionFlagAuth = { featureName: 'auction_enabled', checkUser: true };
  const auctionFlagPublic = { featureName: 'auction_enabled', checkUser: false };

  // Get all unique participants (bidders) for an auction
  fastify.get('/:id/participants', {
    preHandler: [requireAuth, checkFeatureFlag(auctionFlagAuth)]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return auctionController.getAuctionParticipants(request, reply);
  });

  fastify.get('/list', {
    preHandler: [checkFeatureFlag(auctionFlagPublic)]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return auctionController.getAuctionList(request, reply);
  });

  fastify.post('/place-bid', {
    preHandler: [requireAuth, checkFeatureFlag(auctionFlagAuth)]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return auctionController.placeBid(request, reply);
  });

  fastify.get('/user/balance', {
    preHandler: [requireAuth, checkFeatureFlag(auctionFlagAuth)]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return auctionController.getUserBalance(request, reply);
  });

  fastify.get('/timers', {
    preHandler: [checkFeatureFlag(auctionFlagPublic)]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return auctionController.getTimers(request, reply);
  });
}
