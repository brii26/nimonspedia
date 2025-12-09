import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply} from 'fastify';
import adminController from '../controllers/adminController.js';
import reviewController from '../controllers/reviewController.js';
import { verifyAdminToken } from '../middleware/authMiddleware.js';

interface AdminUser {
  user_id: number;
  name: string;
  role: string;
}

type FastifyRequestWithUser = Omit<FastifyRequest, 'user'> & {
  user: AdminUser;
}

export default async function adminRoutes(
  fastify: FastifyInstance, 
  options: FastifyPluginOptions
): Promise<void> {
  // --- Public Routes ---
  fastify.post('/login', adminController.login);

  fastify.get('/me', {
    preHandler: verifyAdminToken
  }, async (req: FastifyRequest, rep: FastifyReply) => {
    const user = ((req as unknown) as FastifyRequestWithUser).user;
    return { 
      status: 'success', 
      data: {
        user_id: user.user_id,
        name: user.name,
        role: 'admin'
      }
    };
  });

  // --- Protected Routes (Butuh Header Authorization: Bearer <token>) ---
  // User Management
  // GET /admin/users?page=1&search=budi
  fastify.get('/users', { 
    preHandler: verifyAdminToken 
  }, adminController.getUsers as any);

  // Feature Flags Management
  // POST /admin/flags/user -> Body: { user_id, feature_name, is_enabled, reason }
  fastify.post('/flags/user', { 
    preHandler: verifyAdminToken 
  }, adminController.updateUserFlag as any);

  // POST /admin/flags/global -> Body: { feature_name, is_enabled, reason }
  fastify.post('/flags/global', { 
    preHandler: verifyAdminToken 
  }, adminController.updateGlobalFlag as any);

  // GET /admin/flags/global -> buat liat status maintenance
  fastify.get('/flags/global', { 
    preHandler: verifyAdminToken 
  }, adminController.getGlobalFlags);

  fastify.get('/stats', { 
    preHandler: verifyAdminToken 
  }, adminController.getStats);

  // --- Review Moderation Routes ---
  // GET /admin/reviews - List all reviews with filters
  fastify.get('/reviews', { 
    preHandler: verifyAdminToken 
  }, reviewController.getReviews as any);

  // GET /admin/reviews/stats - Get review statistics
  fastify.get('/reviews/stats', { 
    preHandler: verifyAdminToken 
  }, reviewController.getReviewStats as any);

  // GET /admin/reviews/:review_id - Get single review
  fastify.get('/reviews/:review_id', { 
    preHandler: verifyAdminToken 
  }, reviewController.getReviewById as any);

  // POST /admin/reviews/:review_id/hide - Hide a review
  fastify.post('/reviews/:review_id/hide', { 
    preHandler: verifyAdminToken 
  }, reviewController.hideReview as any);

  // POST /admin/reviews/:review_id/unhide - Unhide a review
  fastify.post('/reviews/:review_id/unhide', { 
    preHandler: verifyAdminToken 
  }, reviewController.unhideReview as any);

  // POST /admin/reviews/:review_id/respond - Add admin response
  fastify.post('/reviews/:review_id/respond', { 
    preHandler: verifyAdminToken 
  }, reviewController.addAdminResponse as any);

  // PUT /admin/reviews/response - Update admin response
  fastify.put('/reviews/response', { 
    preHandler: verifyAdminToken 
  }, reviewController.updateAdminResponse as any);

  // DELETE /admin/reviews/response - Delete admin response
  fastify.delete('/reviews/response', { 
    preHandler: verifyAdminToken 
  }, reviewController.deleteAdminResponse as any);
}