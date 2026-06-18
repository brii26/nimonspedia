import pool from '../config/database.js';
import { QueryResult } from 'pg';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPreferences {
  chat_enabled: boolean;
  auction_enabled: boolean;
  order_enabled: boolean;
}

class NotificationRepository {
  async saveSubscription(userId: number, subscription: PushSubscriptionData): Promise<void> {
		const checkQuery = 'SELECT 1 FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2';
		const checkRes = await pool.query(checkQuery, [userId, subscription.endpoint]);

		if (checkRes.rowCount === 0) {
		const query = `
			INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key)
			VALUES ($1, $2, $3, $4)
		`;
		await pool.query(query, [
			userId, 
			subscription.endpoint, 
			subscription.keys.p256dh, 
			subscription.keys.auth
		]);
		}
	}

	async getSubscriptionsByUser(userId: number): Promise<PushSubscriptionData[]> {
    const query = 'SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    
    // Mapping format DB ke format standard Web Push
    return result.rows.map(row => ({
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh_key,
        auth: row.auth_key
      }
    }));
  }

	async deleteSubscription(endpoint: string): Promise<void> {
    const query = 'DELETE FROM push_subscriptions WHERE endpoint = $1';
    await pool.query(query, [endpoint]);
  }

	async getPreferences(userId: number): Promise<NotificationPreferences> {
    const query = 'SELECT chat_enabled, auction_enabled, order_enabled FROM push_preferences WHERE user_id = $1';
    const result = await pool.query(query, [userId]);

    if (result.rows.length > 0) {
      return result.rows[0] as NotificationPreferences;
    }

    return {
      chat_enabled: true,
      auction_enabled: true,
      order_enabled: true
    };
  }
	async updatePreferences(userId: number, prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const current = await this.getPreferences(userId);
    
    const newPrefs = { ...current, ...prefs };

    const query = `
      INSERT INTO push_preferences (user_id, chat_enabled, auction_enabled, order_enabled, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        chat_enabled = EXCLUDED.chat_enabled,
        auction_enabled = EXCLUDED.auction_enabled,
        order_enabled = EXCLUDED.order_enabled,
        updated_at = NOW()
      RETURNING chat_enabled, auction_enabled, order_enabled
    `;

    const result = await pool.query(query, [
      userId, 
      newPrefs.chat_enabled, 
      newPrefs.auction_enabled, 
      newPrefs.order_enabled
    ]);

    return result.rows[0] as NotificationPreferences;
  }
}

export default new NotificationRepository();