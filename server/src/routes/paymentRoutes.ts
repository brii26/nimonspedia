import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import paymentController from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { checkFeatureFlag } from '../middleware/featureFlagMiddleware.js';

export default async function paymentRoutes(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    // 1. Webhook Route (Public)
    // No auth middleware required, security handled by signature verification
    fastify.post('/webhook', paymentController.handleWebhook);

    // 2. Initiate Payment Route (Protected)
    // Requires Authentication AND 'checkout_enabled' feature flag
    fastify.post('/initiate', {
        preHandler: [
            requireAuth,
            checkFeatureFlag({ featureName: 'checkout_enabled', checkUser: true })
        ]
    }, paymentController.initiatePayment);
}