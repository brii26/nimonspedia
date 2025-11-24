const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class UserRepository {
  
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  async findByEmailAndRole(email, role) {
    const query = 'SELECT * FROM users WHERE email = $1 AND role = $2';
    const result = await pool.query(query, [email, role]);
    return result.rows[0];
  }

  async findAll({ limit, offset, search, role }) {
    let query = `
      SELECT 
        u.user_id, u.name, u.email, u.role, u.created_at,
        s.store_name,
        (
          SELECT json_agg(json_build_object(
            'feature_name', ufa.feature_name, 
            'is_enabled', ufa.is_enabled,
            'reason', ufa.reason
          ))
          FROM user_feature_access ufa 
          WHERE ufa.user_id = u.user_id
        ) as feature_flags
      FROM users u
      LEFT JOIN stores s ON u.user_id = s.user_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role && role !== 'ALL') {
      query += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    query += ` ORDER BY u.user_id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async countTotal() {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    return parseInt(result.rows[0].count);
  }

  async seedAdminUser() {
    const adminData = {
      email: 'admin@nimonspedia.com',
      password: 'admin123',
      name: 'System Administrator',
      address: 'Admin Office',
      role: 'ADMIN'
    };

    const existingAdmin = await this.findByEmailAndRole(adminData.email, adminData.role);
    
    if (existingAdmin) {
      console.log('Admin user already exists, skipping seed...');
      return existingAdmin;
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    const query = `
      INSERT INTO users (email, password, name, address, role, balance, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5::user_role, 0, NOW(), NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      adminData.email,
      hashedPassword,
      adminData.name,
      adminData.address,
      adminData.role
    ]);

    console.log('Admin user seeded successfully!');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    
    return result.rows[0];
  }

  async deleteUserById(userId) {
    const query = 'DELETE FROM users WHERE user_id = $1 RETURNING *';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  async getDashboardStats() {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'BUYER') as total_buyers,
        (SELECT COUNT(*) FROM users WHERE role = 'SELLER') as total_sellers,
        (SELECT COUNT(*) FROM auctions WHERE status = 'active') as active_auctions
    `;
    
    const result = await pool.query(query);
    
    const row = result.rows[0];
    return {
      totalUsers: parseInt(row.total_users),
      totalBuyers: parseInt(row.total_buyers),
      totalSellers: parseInt(row.total_sellers),
      activeAuctions: parseInt(row.active_auctions)
    };
  }
}

module.exports = new UserRepository();