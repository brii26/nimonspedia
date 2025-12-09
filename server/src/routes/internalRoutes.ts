import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import orderNotificationController from '../controllers/orderNotificationController.js';

/**
 * Internal routes - dipanggil oleh PHP backend
 * Tidak memerlukan user authentication, tapi memerlukan internal API key
 */
export default async function internalRoutes(
  fastify: FastifyInstance, 
  options: FastifyPluginOptions
) {
  // POST /internal/notify/order
  fastify.post('/notify/order', orderNotificationController.triggerOrderNotification);
}
