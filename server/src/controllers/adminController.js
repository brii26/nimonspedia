const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const featureFlagRepository = require('../repositories/featureFlagRepository');

// --- AUTH ---

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid input format' });
  }

  try {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch || user.role !== 'ADMIN') {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET || 'rahasia_negara_nimons';
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, name: user.name },
      secret,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      token: token,
      user: { id: user.user_id, name: user.name, role: user.role }
    });

  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 10;
    const offset = (pageInt - 1) * limitInt;

    const users = await userRepository.findAll({ 
      limit: limitInt, 
      offset, 
      search: String(search), 
      role 
    });
    
    const totalUsers = await userRepository.countTotal();

    res.json({
      success: true,
      data: users,
      pagination: {
        current_page: pageInt,
        total_pages: Math.ceil(totalUsers / limitInt),
        total_items: totalUsers
      }
    });

  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// --- FEATURE FLAGS ---

exports.updateUserFlag = async (req, res) => {
  const { user_id, feature_name, is_enabled, reason } = req.body;
  const enabledBool = Boolean(is_enabled);

  try {
    await featureFlagRepository.upsertUserFlag(user_id, feature_name, enabledBool, reason);
    res.json({ success: true, message: `Feature updated for user ${user_id}` });
  } catch (error) {
    console.error('Update User Flag Error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

exports.updateGlobalFlag = async (req, res) => {
  const { feature_name, is_enabled, reason } = req.body;
  const enabledBool = Boolean(is_enabled);

  try {
    await featureFlagRepository.upsertGlobalFlag(feature_name, enabledBool, reason);
    res.json({ success: true, message: `Global feature updated` });
  } catch (error) {
    console.error('Update Global Flag Error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

exports.getGlobalFlags = async (req, res) => {
  try {
    const flags = await featureFlagRepository.getGlobalFlags();
    res.json({ success: true, data: flags });
  } catch (error) {
    console.error('Get Global Flags Error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};