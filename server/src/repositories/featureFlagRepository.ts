import pool from '../config/database.js';
import { QueryResult } from 'pg';

// Type definitions
interface FeatureFlag {
  feature_name: string;
  is_enabled: boolean;
  reason?: string;
}

interface GlobalFeatureFlag extends FeatureFlag {
  id: number;
  created_at: Date;
  updated_at: Date;
}

class FeatureFlagRepository {

  async upsertUserFlag(
    userId: string, 
    featureName: string, 
    isEnabled: boolean, 
    reason: string
  ): Promise<QueryResult> {
    const check = await pool.query(
      'SELECT * FROM user_feature_access WHERE user_id = $1 AND feature_name = $2',
      [userId, featureName]
    );

    if (check.rows.length > 0) {
      return await pool.query(
        'UPDATE user_feature_access SET is_enabled = $1, reason = $2, updated_at = NOW() WHERE user_id = $3 AND feature_name = $4',
        [isEnabled, reason, userId, featureName]
      );
    } else {
      return await pool.query(
        'INSERT INTO user_feature_access (user_id, feature_name, is_enabled, reason) VALUES ($1, $2, $3, $4)',
        [userId, featureName, isEnabled, reason]
      );
    }
  }

  async upsertGlobalFlag(
    featureName: string, 
    isEnabled: boolean, 
    reason: string
  ): Promise<QueryResult> {
    const check = await pool.query(
      'SELECT * FROM user_feature_access WHERE user_id IS NULL AND feature_name = $1',
      [featureName]
    );

    if (check.rows.length > 0) {
      return await pool.query(
        'UPDATE user_feature_access SET is_enabled = $1, reason = $2, updated_at = NOW() WHERE user_id IS NULL AND feature_name = $3',
        [isEnabled, reason, featureName]
      );
    } else {
      return await pool.query(
        'INSERT INTO user_feature_access (user_id, feature_name, is_enabled, reason) VALUES (NULL, $1, $2, $3)',
        [featureName, isEnabled, reason]
      );
    }
  }

  async getGlobalFlags() {
    const result = await pool.query(
      'SELECT access_id, feature_name, is_enabled, reason, updated_at FROM user_feature_access WHERE user_id IS NULL'
    );
    return result.rows; 
  }
}

export default new FeatureFlagRepository();