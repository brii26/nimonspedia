import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository.js';
import featureFlagRepository from '../repositories/featureFlagRepository.js';
// --- AUTH ---
export const login = async (request, reply) => {
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
        const token = jwt.sign({ user_id: user.user_id, role: user.role, name: user.name }, secret, { expiresIn: '1h' });
        return reply.send({
            success: true,
            token: token,
            user: { id: user.user_id, name: user.name, role: user.role }
        });
    }
    catch (error) {
        request.log.error({ error }, 'Admin Login Error');
        return reply.status(500).send({ success: false, message: 'Server error' });
    }
};
export const getUsers = async (request, reply) => {
    try {
        let { page = '1', limit = '10', search = '', role = '' } = request.query;
        const pageInt = parseInt(page) || 1;
        const limitInt = parseInt(limit) || 10;
        const offset = (pageInt - 1) * limitInt;
        const result = await userRepository.findAll({
            limit: limitInt,
            offset,
            search: String(search),
            role
        });
        const { users, total } = result;
        return reply.send({
            success: true,
            data: users,
            pagination: {
                current_page: pageInt,
                total_pages: Math.ceil(total / limitInt),
                total_items: total
            }
        });
    }
    catch (error) {
        request.log.error({ error }, 'Get Users Error');
        return reply.status(500).send({ success: false, message: 'Failed to fetch users' });
    }
};
// --- FEATURE FLAGS ---
export const updateUserFlag = async (request, reply) => {
    const { user_id, feature_name, is_enabled, reason } = request.body;
    const enabledBool = Boolean(is_enabled);
    try {
        await featureFlagRepository.upsertUserFlag(user_id, feature_name, enabledBool, reason);
        return reply.send({ success: true, message: `Feature updated for user ${user_id}` });
    }
    catch (error) {
        request.log.error({ error }, 'Update User Flag Error');
        return reply.status(500).send({ success: false, message: 'Database error' });
    }
};
export const updateGlobalFlag = async (request, reply) => {
    const { feature_name, is_enabled, reason } = request.body;
    const enabledBool = Boolean(is_enabled);
    try {
        await featureFlagRepository.upsertGlobalFlag(feature_name, enabledBool, reason);
        return reply.send({ success: true, message: `Global feature updated` });
    }
    catch (error) {
        request.log.error({ error }, 'Update Global Flag Error');
        return reply.status(500).send({ success: false, message: 'Database error' });
    }
};
export const getGlobalFlags = async (request, reply) => {
    try {
        const flags = await featureFlagRepository.getGlobalFlags();
        return reply.send({ success: true, data: flags });
    }
    catch (error) {
        request.log.error({ error }, 'Get Global Flags Error');
        return reply.status(500).send({ success: false, message: 'Database error' });
    }
};
export const getStats = async (request, reply) => {
    try {
        const stats = await userRepository.getDashboardStats();
        return reply.send({
            success: true,
            data: {
                totalUsers: stats.totalUsers,
                totalBuyers: stats.totalBuyers,
                totalSellers: stats.totalSellers,
                activeAuctions: stats.activeAuctions
            }
        });
    }
    catch (error) {
        request.log.error({ error }, 'Get Dashboard Stats Error');
        return reply.status(500).send({ success: false, message: 'Failed to fetch statistics' });
    }
};
export default {
    login,
    getUsers,
    updateUserFlag,
    updateGlobalFlag,
    getGlobalFlags,
    getStats
};
//# sourceMappingURL=adminController.js.map