// server/src/types/payment.ts

// Enum for internal transaction statuses, directly mapping to DB ENUM `payment_status`.
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'expired';

// Enum for payment types, directly mapping to DB ENUM `payment_type`.
export type PaymentType = 'topup' | 'order_payment';

/**
 * Interface representing a row in the `payment_transactions` database table.
 * `amount` is string to maintain precision for monetary values.
 */
export interface PaymentTransaction {
    transaction_id: number;
    user_id: number;
    amount: string; // Monetary value as string for precision (e.g., "10000.00").
    payment_type: PaymentType;
    order_id: number | null; // Nullable; associated order ID if `payment_type` is 'order_payment'.
    status: PaymentStatus;
    external_id: string; // Unique ID from Payment Gateway (e.g., Midtrans Order ID), crucial for idempotency.
    snap_token: string | null; // Midtrans Snap token, used for client-side redirect/pop-up.
    created_at: Date;
    updated_at: Date;
}

/**
 * DTO for initiating a new payment request from the client.
 */
export interface InitiatePaymentDTO {
    userId: number;
    amount: number; // Input amount from client, to be validated (positive integer).
    paymentType: PaymentType;
    orderId?: number; // Optional; required if `paymentType` is 'order_payment'.
    description?: string; // Optional; payment description for gateway.
    clientBaseUrl?: string; // Optional; the base URL of the client initiating the request.
}

/**
 * Result returned to the client after successfully initiating a payment with the gateway.
 */
export interface InitiatePaymentResult {
    transactionId: number; // Internal transaction ID.
    redirectUrl: string;   // URL to redirect the user to the Payment Gateway (e.g., Midtrans Snap page).
    snapToken: string;     // Midtrans Snap token.
    externalId: string;    // The unique ID sent to Midtrans for this transaction.
}

/**
 * Interface for the notification payload received from Midtrans' webhook.
 * Contains critical data for transaction verification and status updates.
 */
export interface MidtransNotification {
    transaction_time: string;
    transaction_status: string; // Midtrans status (e.g., 'capture', 'settlement', 'pending', 'deny', 'expire', 'cancel').
    fraud_status?: 'accept' | 'challenge'; // Fraud detection status from Midtrans.
    payment_type: string; // Payment method (e.g., 'credit_card', 'gopay').
    order_id: string;     // Corresponds to our `external_id`.
    gross_amount: string; // Transaction amount as a string.
    status_code: string;  // Midtrans response status code.
    signature_key: string; // Signature for webhook authenticity verification.
    transaction_id: string; // Unique transaction ID from Midtrans.
    merchant_id: string;
    // Other optional fields can be added as needed from Midtrans documentation.
    masked_card?: string;
    bank?: string;
    va_numbers?: Array<{ bank: string, va_number: string }>;
}

/**
 * Interface for Midtrans API configuration used in the Node.js backend.
 */
export interface MidtransConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
}