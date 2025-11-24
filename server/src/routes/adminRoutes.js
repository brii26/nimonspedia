const adminController = require('../controllers/adminController');
const { verifyAdminToken } = require('../middleware/authMiddleware');

async function adminRoutes(fastify, options) {
  // --- Public Routes ---
  fastify.post('/login', adminController.login);

  // --- Protected Routes (Butuh Header Authorization: Bearer <token>) ---
  // User Management
  // GET /admin/users?page=1&search=budi
  fastify.get('/users', { 
    preHandler: verifyAdminToken 
  }, adminController.getUsers);

  // Feature Flags Management
  // POST /admin/flags/user -> Body: { user_id, feature_name, is_enabled, reason }
  fastify.post('/flags/user', { 
    preHandler: verifyAdminToken 
  }, adminController.updateUserFlag);

  // POST /admin/flags/global -> Body: { feature_name, is_enabled, reason }
  fastify.post('/flags/global', { 
    preHandler: verifyAdminToken 
  }, adminController.updateGlobalFlag);

  // GET /admin/flags/global -> buat liat status maintenance
  fastify.get('/flags/global', { 
    preHandler: verifyAdminToken 
  }, adminController.getGlobalFlags);

  fastify.get('/stats', { 
    preHandler: verifyAdminToken 
  }, adminController.getStats);
}

module.exports = adminRoutes;