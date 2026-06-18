import pool from '../config/database.js';
import { PoolClient, QueryResult } from 'pg';

class OrderRepository {
  async createOrder(orderData: any, items: any[], client: PoolClient | null = null): Promise<number> {
    const db = client || pool;

    // 1. Insert Order
    const orderRes = await db.query(`
      INSERT INTO orders (buyer_id, store_id, total_price, shipping_address, status, created_at)
      VALUES ($1, $2, $3, $4, 'approved', NOW())
      RETURNING order_id
    `, [orderData.buyer_id, orderData.store_id, orderData.total_price, orderData.shipping_address]);

    const orderId = orderRes.rows[0].order_id;

    // 2. Insert Items (Looping atau Bulk Insert)
    for (const item of items) {
      await db.query(`
        INSERT INTO order_items (order_id, product_id, quantity, price_at_order, subtotal)
        VALUES ($1, $2, $3, $4, $5)
      `, [orderId, item.product_id, item.quantity, item.price, item.subtotal]);
    }

    return orderId;
  }
}

export default new OrderRepository();