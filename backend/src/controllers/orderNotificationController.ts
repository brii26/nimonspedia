import { FastifyRequest, FastifyReply } from 'fastify';
import notificationService from '../services/notificationService.js';

/**
 * Internal API untuk trigger notifikasi order.
 * Dipanggil oleh PHP backend saat ada perubahan status order.
 */

interface OrderNotificationBody {
  type: 'order_approved' | 'order_rejected' | 'order_on_delivery' | 'order_waiting_approval' | 'order_received';
  order_id: number;
  recipient_id: number;  // user_id yang akan menerima notifikasi
  order_data: {
    product_name?: string;
    store_name?: string;
    buyer_name?: string;
    reject_reason?: string;
    total_price?: number;
  };
}

// Secret key untuk validasi request dari PHP (simple auth)
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'nimonspedia-internal-key';

/**
 * Trigger order notification
 * POST /internal/notify/order
 */
export const triggerOrderNotification = async (
  request: FastifyRequest<{ Body: OrderNotificationBody }>,
  reply: FastifyReply
) => {
  try {
    // Validasi internal API key
    const apiKey = request.headers['x-internal-api-key'];
    if (apiKey !== INTERNAL_API_KEY) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    const { type, order_id, recipient_id, order_data } = request.body;

    if (!type || !order_id || !recipient_id) {
      return reply.status(400).send({ 
        success: false, 
        message: 'Missing required fields: type, order_id, recipient_id' 
      });
    }

    // Build notification payload berdasarkan type
    const payload = buildNotificationPayload(type, order_id, order_data);

    // Send notification
    await notificationService.sendNotification(recipient_id, 'order', payload);

    request.log.info({ type, order_id, recipient_id }, 'Order notification sent');
    
    return reply.send({ success: true, message: 'Notification sent' });

  } catch (error) {
    request.log.error({ error }, 'Failed to send order notification');
    return reply.status(500).send({ success: false, message: 'Failed to send notification' });
  }
};

/**
 * Build notification payload based on notification type
 */
function buildNotificationPayload(
  type: OrderNotificationBody['type'], 
  orderId: number, 
  data: OrderNotificationBody['order_data']
) {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:8080';
  
  switch (type) {
    // === BUYER NOTIFICATIONS ===
    case 'order_approved':
      return {
        title: 'Pesanan Disetujui! ✅',
        body: `Pesanan #${orderId} dari ${data.store_name || 'Toko'} telah disetujui dan sedang diproses.`,
        url: `${baseUrl}/orders?id=${orderId}`,
        icon: '/assets/icons/order-approved.png',
        tag: `order-${orderId}`,
        data: { type, orderId }
      };

    case 'order_rejected':
      return {
        title: 'Pesanan Ditolak ❌',
        body: `Pesanan #${orderId} ditolak. Alasan: ${data.reject_reason || 'Tidak tersedia'}`,
        url: `${baseUrl}/orders?id=${orderId}`,
        icon: '/assets/icons/order-rejected.png',
        tag: `order-${orderId}`,
        data: { type, orderId }
      };

    case 'order_on_delivery':
      return {
        title: 'Pesanan Dikirim! 🚚',
        body: `Pesanan #${orderId} sedang dalam perjalanan menuju alamat Anda.`,
        url: `${baseUrl}/orders?id=${orderId}`,
        icon: '/assets/icons/order-delivery.png',
        tag: `order-${orderId}`,
        data: { type, orderId }
      };

    // === SELLER NOTIFICATIONS ===
    case 'order_waiting_approval':
      return {
        title: 'Pesanan Baru! 🛒',
        body: `Ada pesanan baru dari ${data.buyer_name || 'Pembeli'}. Segera proses pesanan.`,
        url: `${baseUrl}/seller/orders?status=waiting_approval`,
        icon: '/assets/icons/new-order.png',
        tag: `order-${orderId}`,
        data: { type, orderId }
      };

    case 'order_received':
      return {
        title: 'Pesanan Diterima! 🎉',
        body: `Pesanan #${orderId} telah dikonfirmasi diterima oleh pembeli.`,
        url: `${baseUrl}/seller/orders?status=received`,
        icon: '/assets/icons/order-received.png',
        tag: `order-${orderId}`,
        data: { type, orderId }
      };

    default:
      return {
        title: 'Update Pesanan',
        body: `Ada update untuk pesanan #${orderId}`,
        url: `${baseUrl}/orders`,
        icon: '/assets/icons/order.png',
        tag: `order-${orderId}`,
        data: { type, orderId }
      };
  }
}

export default {
  triggerOrderNotification
};
