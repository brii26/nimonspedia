const pool = require('../config/database');

class UserRepository {
  
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
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
}

module.exports = new UserRepository();