import pool from '../config/database.js';
import { PaymentStatus, PaymentTransaction, PaymentType } from '../types/payment.js';

export class PaymentRepository {
    /**
     * Creates a new payment transaction record.
     */
    async createTransaction(
        userId: number,
        amount: number,
        paymentType: PaymentType,
        orderId: number | null,
        externalId: string,
        snapToken?: string
    ): Promise<PaymentTransaction> {
        const query = `
            INSERT INTO payment_transactions 
            (user_id, amount, payment_type, order_id, external_id, snap_token, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending')
            RETURNING *
        `;
        const values = [userId, amount, paymentType, orderId, externalId, snapToken];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Finds a transaction by its external ID (Midtrans Order ID).
     */
    async findByExternalId(externalId: string): Promise<PaymentTransaction | null> {
        const query = `
            SELECT * FROM payment_transactions WHERE external_id = $1
        `;
        const result = await pool.query(query, [externalId]);
        return result.rows[0] || null;
    }

    /**
     * Updates the status of a transaction.
     */
    async updateTransactionStatus(
        transactionId: number,
        status: PaymentStatus
    ): Promise<PaymentTransaction | null> {
        const query = `
            UPDATE payment_transactions
            SET status = $1, updated_at = NOW()
            WHERE transaction_id = $2
            RETURNING *
        `;
        const result = await pool.query(query, [status, transactionId]);
        return result.rows[0] || null;
    }

    /**
     * Atomically completes a successful transaction:
     * 1. Updates payment_transaction status to 'success'.
     * 2. Updates user balance.
     * 3. (Optional) Updates order status if it's an order payment.
     */
    async completeSuccessTransaction(
        transactionId: number,
        userId: number,
        amount: number,
        paymentType: PaymentType,
        orderId: number | null
    ): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Update Payment Transaction Status
            const updateTxQuery = `
                UPDATE payment_transactions
                SET status = 'success', updated_at = NOW()
                WHERE transaction_id = $1
            `;
            await client.query(updateTxQuery, [transactionId]);

            // 2. Update User Balance (Locking row is implicit in UPDATE)
            const updateUserQuery = `
                UPDATE users
                SET balance = balance + $1, updated_at = NOW()
                WHERE user_id = $2
            `;
            await client.query(updateUserQuery, [amount, userId]);

            // 3. Update Order Status (if applicable)
            if (paymentType === 'order_payment' && orderId) {
                // We assume 'approved' means paid. 
                // Note: The store balance update is handled by the DB trigger 'trg_orders_received_update_balance'
                // which fires when status becomes 'received', not 'approved'.
                // So here we simply mark the order as approved/paid.
                const updateOrderQuery = `
                    UPDATE orders
                    SET status = 'approved', confirmed_at = NOW()
                    WHERE order_id = $1
                `;
                await client.query(updateOrderQuery, [orderId]);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}