import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import notificationController from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js'; // Pastikan path ini benar

export default async function notificationRoutes(
  fastify: FastifyInstance, 
  options: FastifyPluginOptions
) {
  // Public Route (untuk ambil key saat inisialisasi)
  fastify.get('/vapid-public-key', notificationController.getVapidPublicKey);

  // Protected Routes (Butuh Login)
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', requireAuth);

    // POST /api/node/notifications/subscribe
    protectedRoutes.post('/subscribe', notificationController.subscribe);

    // GET /api/node/notifications/preferences
    protectedRoutes.get('/preferences', notificationController.getPreferences);

    // PUT /api/node/notifications/preferences
    protectedRoutes.put('/preferences', notificationController.updatePreferences);
  });
}