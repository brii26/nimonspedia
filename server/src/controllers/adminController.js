const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const featureFlagRepository = require('../repositories/featureFlagRepository');

// --- AUTH ---

exports.login = async (request, reply) => {
  const { email, password } = request.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return reply.status(400).send({ success: false, message: 'Invalid input format' });
  }

  try {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      return reply.status(401).send({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch || user.role !== 'ADMIN') {
      return reply.status(401).send({ success: false, message: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET || 'rahasia_negara_nimons';
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, name: user.name },
      secret,
      { expiresIn: '1h' }
    );

    return reply.send({
      success: true,
      token: token,
      user: { id: user.user_id, name: user.name, role: user.role }
    });

  } catch (error) {
    request.log.error('Admin Login Error:', error);
    return reply.status(500).send({ success: false, message: 'Server error' });
  }
};

exports.getUsers = async (request, reply) => {
  try {
    let { page = 1, limit = 10, search = '', role = '' } = request.query;
    
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

    return reply.send({
      success: true,
      data: users,
      pagination: {
        current_page: pageInt,
        total_pages: Math.ceil(totalUsers / limitInt),
        total_items: totalUsers
      }
    });

  } catch (error) {
    request.log.error('Get Users Error:', error);
    return reply.status(500).send({ success: false, message: 'Failed to fetch users' });
  }
};

// --- FEATURE FLAGS ---

exports.updateUserFlag = async (request, reply) => {
  const { user_id, feature_name, is_enabled, reason } = request.body;
  const enabledBool = Boolean(is_enabled);

  try {
    await featureFlagRepository.upsertUserFlag(user_id, feature_name, enabledBool, reason);
    return reply.send({ success: true, message: `Feature updated for user ${user_id}` });
  } catch (error) {
    request.log.error('Update User Flag Error:', error);
    return reply.status(500).send({ success: false, message: 'Database error' });
  }
};

exports.updateGlobalFlag = async (request, reply) => {
  const { feature_name, is_enabled, reason } = request.body;
  const enabledBool = Boolean(is_enabled);

  try {
    await featureFlagRepository.upsertGlobalFlag(feature_name, enabledBool, reason);
    return reply.send({ success: true, message: `Global feature updated` });
  } catch (error) {
    request.log.error('Update Global Flag Error:', error);
    return reply.status(500).send({ success: false, message: 'Database error' });
  }
};

exports.getGlobalFlags = async (request, reply) => {
  try {
    const flags = await featureFlagRepository.getGlobalFlags();
    return reply.send({ success: true, data: flags });
  } catch (error) {
    request.log.error('Get Global Flags Error:', error);
    return reply.status(500).send({ success: false, message: 'Database error' });
  }
};