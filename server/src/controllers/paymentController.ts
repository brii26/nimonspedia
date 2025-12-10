import { FastifyRequest, FastifyReply } from 'fastify';
import { PaymentService } from '../services/paymentService.js'; // Fixed import
import { InitiatePaymentDTO } from '../types/payment.js'; // Fixed import

const paymentService = new PaymentService();

interface InitiatePaymentBody {
    amount: number;
    paymentType: 'topup' | 'order_payment';
    orderId?: number;
    description?: string;
}

export const initiatePayment = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    // 1. Get authenticated user from request (attached by requireAuth middleware)
    const user = request.user;
    if (!user) {
        return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    const { amount, paymentType, orderId, description } = request.body as InitiatePaymentBody;

    // 2. Validate input
    if (!amount || amount <= 0) {
        return reply.status(400).send({ success: false, message: 'Invalid amount' });
    }
    if (paymentType === 'order_payment' && !orderId) {
        return reply.status(400).send({ success: false, message: 'Order ID is required for order payments' });
    }

    try {
        // 3. Prepare DTO
        const dto: InitiatePaymentDTO = {
            userId: parseInt(user.user_id),
            amount,
            paymentType,
            orderId,
            description
        };

        // 4. Call Service
        const result = await paymentService.initiateMidtransPayment(dto);

        // 5. Send Response
        return reply.send({
            success: true,
            data: result
        });
    } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({ success: false, message: error.message || 'Failed to initiate payment' });
    }
};

export const handleWebhook = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    try {
        const notification = request.body as any; // Typed inside service

        // Call service to process webhook
        await paymentService.processMidtransWebhook(notification);

        // Always return 200 OK to Midtrans to verify receipt
        return reply.status(200).send({ success: true });
    } catch (error: any) {
        // Log error but still return 200 OK (unless it's a critical system failure where we WANT retry)
        // Midtrans expects 200 OK to stop retrying.
        // If signature is invalid, we might want to return 400, but often 200 is safer to prevent spamming.
        request.log.error(error);
        return reply.status(200).send({ success: false, message: 'Webhook processed with errors' });
    }
};

export const checkStatus = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    // 1. Get externalId from params
    const { externalId } = request.params as { externalId: string };

    if (!externalId) {
        return reply.status(400).send({ success: false, message: 'External ID is required' });
    }

    try {
        // 2. Call Service
        const transaction = await paymentService.getTransactionStatus(externalId);

        // 3. Return Status
        return reply.send({
            success: true,
            data: transaction
        });
    } catch (error: any) {
        if (error.message === 'Transaction not found') {
            return reply.status(404).send({ success: false, message: 'Transaction not found' });
        }
        request.log.error(error);
        return reply.status(500).send({ success: false, message: 'Failed to check status' });
    }
};

export default {
    initiatePayment,
    handleWebhook,
    checkStatus
};