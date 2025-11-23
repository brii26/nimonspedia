const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdminToken } = require('../middleware/authMiddleware');

// --- Public Routes ---
router.post('/login', adminController.login);

// --- Protected Routes (Butuh Header Authorization: Bearer <token>) ---
// User Management
// GET /api/node/admin/users?page=1&search=budi
router.get('/users', verifyAdminToken, adminController.getUsers);

// Feature Flags Management
// POST /api/node/admin/flags/user -> Body: { user_id, feature_name, is_enabled, reason }
router.post('/flags/user', verifyAdminToken, adminController.updateUserFlag);

// POST /api/node/admin/flags/global -> Body: { feature_name, is_enabled, reason }
router.post('/flags/global', verifyAdminToken, adminController.updateGlobalFlag);

// GET /api/node/admin/flags/global -> buat liat status maintenance
router.get('/flags/global', verifyAdminToken, adminController.getGlobalFlags);

module.exports = router;