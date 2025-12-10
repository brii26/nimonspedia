import midtransClient from 'midtrans-client';
import { PaymentRepository } from '../repositories/paymentRepository.js'; // Fixed import
import { 
    InitiatePaymentDTO, 
    InitiatePaymentResult, 
    MidtransNotification, 
    PaymentType,
    PaymentTransaction
} from '../types/payment.js'; // Fixed import
import crypto from 'crypto';
import 'dotenv/config';
import notificationService from './notificationService.js'; // Fixed import

const paymentRepository = new PaymentRepository();

// Initialize Midtrans Core API (Snap)
const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
});

// Helper for building notification payload
interface PaymentNotificationPayload {
    title: string;
    body: string;
    url?: string;
    icon?: string;
    [key: string]: any;
}

function buildPaymentNotificationPayload(
    type: 'success' | 'failed' | 'expired',
    transaction: PaymentTransaction
): PaymentNotificationPayload {
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:8080';
    let title = '';
    let body = '';
    let url = `${baseUrl}/profile`; // Default URL to profile page

    switch (type) {
        case 'success':
            title = 'Pembayaran Berhasil! 🎉';
            if (transaction.payment_type === 'topup') {
                body = `Top Up sebesar Rp${transaction.amount} berhasil! Saldo Anda bertambah.`;
            } else if (transaction.payment_type === 'order_payment' && transaction.order_id) {
                body = `Pembayaran untuk Pesanan #${transaction.order_id} sebesar Rp${transaction.amount} berhasil!`;
                url = `${baseUrl}/orders?id=${transaction.order_id}`;
            }
            break;
        case 'failed':
        case 'expired':
            title = `Pembayaran ${type === 'expired' ? 'Kadaluarsa' : 'Gagal'} ❌`;
            if (transaction.payment_type === 'topup') {
                body = `Top Up sebesar Rp${transaction.amount} gagal/kadaluarsa.`;
            } else if (transaction.payment_type === 'order_payment' && transaction.order_id) {
                body = `Pembayaran untuk Pesanan #${transaction.order_id} sebesar Rp${transaction.amount} gagal/kadaluarsa.`;
                url = `${baseUrl}/orders?id=${transaction.order_id}`;
            }
            break;
    }

    return {
        title,
        body,
        url,
        icon: type === 'success' ? '/assets/icons/payment-success.png' : '/assets/icons/payment-failed.png',
        tag: `payment-${transaction.transaction_id}`,
        data: { transaction_id: transaction.transaction_id, type }
    };
}


export class PaymentService {
    /**
     * Initiates a payment transaction.
     * 1. Generates external ID.
     * 2. Calls Midtrans Snap API to get token & redirect URL.
     * 3. Saves pending transaction to DB.
     */
    async initiateMidtransPayment(dto: InitiatePaymentDTO): Promise<InitiatePaymentResult> {
        // 1. Generate unique External ID (Order ID for Midtrans)
        // Format: TYPE-USERID-TIMESTAMP-RANDOM (e.g., TOPUP-123-1701234567-AB12)
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const prefix = dto.paymentType === 'topup' ? 'TOPUP' : 'ORDER';
        const externalId = `${prefix}-${dto.userId}-${timestamp}-${randomStr}`;

        // 2. Prepare Parameter for Midtrans Snap
        const parameter = {
            transaction_details: {
                order_id: externalId,
                gross_amount: dto.amount
            },
            credit_card: {
                secure: true
            },
            item_details: dto.description ? [{
                id: dto.paymentType,
                price: dto.amount,
                quantity: 1,
                name: dto.description
            }] : undefined,
            // Fetch user details from DB here for customer_details
            customer_details: {
                // Example: user_id is already in custom_field1, but Midtrans expects these
                // first_name: user.name,
                // email: user.email,
                // phone: user.phone,
            },
            // Custom field for internal data (user_id, paymentType, order_id)
            custom_field1: JSON.stringify({ userId: dto.userId, paymentType: dto.paymentType, orderId: dto.orderId }),
            callbacks: {
                // This will redirect user back to your site after payment (success/failure)
                finish: `${process.env.CLIENT_URL || 'http://localhost:8080'}/payments/status?external_id=${externalId}`
                // error: `${process.env.CLIENT_URL || 'http://localhost:8080'}/payments/status?external_id=${externalId}&status=error`,
                // back: `${process.env.CLIENT_URL || 'http://localhost:8080'}/payments/status?external_id=${externalId}&status=back`,
            }
        };

        try {
            // 3. Call Midtrans API
            const transaction = await snap.createTransaction(parameter);
            const snapToken = transaction.token;
            const redirectUrl = transaction.redirect_url;

            // 4. Save to Database
            // Convert amount to string for storage precision
            const createdTx = await paymentRepository.createTransaction(
                dto.userId,
                dto.amount,
                dto.paymentType,
                dto.orderId || null,
                externalId,
                snapToken
            );

            return {
                transactionId: createdTx.transaction_id, // Return real ID
                redirectUrl: redirectUrl,
                snapToken: snapToken,
                externalId: externalId
            };
        } catch (error) {
            console.error('Midtrans Initiation Error:', error);
            throw new Error('Failed to initiate payment gateway');
        }
    }

    /**
     * Processes the webhook notification from Midtrans.
     * Handles signature verification, idempotency, and status updates.
     */
    async processMidtransWebhook(notification: MidtransNotification): Promise<void> {
        // 1. Verify Signature
        // Signature = SHA512(order_id + status_code + gross_amount + ServerKey)
        const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
        const inputString = notification.order_id + notification.status_code + notification.gross_amount + serverKey;
        const signature = crypto.createHash('sha512').update(inputString).digest('hex');

        if (signature !== notification.signature_key) {
            console.warn(`Invalid Signature for Order ID ${notification.order_id}`);
            throw new Error('Invalid Webhook Signature');
        }

        // 2. Find Transaction
        const transaction = await paymentRepository.findByExternalId(notification.order_id);
        if (!transaction) {
            console.error(`Transaction not found: ${notification.order_id}`);
            // Return OK to Midtrans to stop them from retrying if it's a ghost transaction
            return; 
        }

        // 3. Idempotency Check
        // If already successful, do nothing. For others (failed/expired), allow re-processing if Midtrans retries.
        if (transaction.status === 'success') {
            console.log(`Transaction ${notification.order_id} already successfully processed.`);
            return;
        }

        // 4. Determine Status and Process
        const midtransTransactionStatus = notification.transaction_status;
        const fraudStatus = notification.fraud_status;

        console.log(`Processing Webhook: ${notification.order_id} | Midtrans Status: ${midtransTransactionStatus} | Fraud: ${fraudStatus}`);

        // A. Successful transaction statuses
        if (midtransTransactionStatus === 'capture' || midtransTransactionStatus === 'settlement') {
            if (fraudStatus === 'challenge') {
                // For 'challenge', we might want to flag it for manual review or treat it as pending.
                // For now, we'll keep it as 'pending' in our system until manually accepted/denied.
                console.warn(`Transaction ${notification.order_id} is in 'challenge' state. No balance update.`);
                return; 
            } else if (transaction.status !== 'success') { // Ensure not already success
                // Call atomic complete success transaction
                await paymentRepository.completeSuccessTransaction(
                    transaction.transaction_id,
                    transaction.user_id,
                    parseInt(transaction.amount), // Convert string amount back to number for arithmetic
                    transaction.payment_type,
                    transaction.order_id
                );
                const notificationPayload = buildPaymentNotificationPayload('success', transaction);
                await notificationService.sendNotification(transaction.user_id, 'order', notificationPayload);
            }
        } 
        // B. Failed or Expired transaction statuses
        else if (midtransTransactionStatus === 'cancel' || midtransTransactionStatus === 'deny' || midtransTransactionStatus === 'expire') {
            if (transaction.status !== 'failed' && transaction.status !== 'expired') { // Prevent double updates for failed/expired
                let newStatus: 'failed' | 'expired' = 'failed';
                if (midtransTransactionStatus === 'expire') newStatus = 'expired';
                
                const updatedTx = await paymentRepository.updateTransactionStatus(
                    transaction.transaction_id,
                    newStatus
                );
                if (updatedTx) {
                    const notificationPayload = buildPaymentNotificationPayload(newStatus, updatedTx);
                    await notificationService.sendNotification(updatedTx.user_id, 'order', notificationPayload);
                }
            }
        } 
        // C. Pending transaction statuses (do nothing, or update to 'pending' explicitly if needed)
        else if (midtransTransactionStatus === 'pending') {
            // Transaction is still pending, no action needed other than initial 'pending' status
            console.log(`Transaction ${notification.order_id} is still pending.`);
            return;
        }
    }
}