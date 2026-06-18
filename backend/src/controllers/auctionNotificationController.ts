import { FastifyRequest, FastifyReply } from 'fastify';
import notificationService from '../services/notificationService.js';

/**
 * Internal API untuk trigger notifikasi auction.
 * Dipanggil oleh PHP backend saat ada perubahan status auction.
 */

interface AuctionNotificationBody {
  type: 'auction_outbid' | 'auction_won' | 'auction_ending_soon';
  auction_id: number;
  recipient_id: number;  // user_id yang akan menerima notifikasi
  auction_data: {
    product_name?: string;
    new_bid_amount?: number;
    final_price?: number;
    end_time?: string;
  };
}

// Secret key untuk validasi request dari PHP (simple auth)
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'nimonspedia-internal-key';

/**
 * Trigger auction notification
 * POST /internal/notify/auction
 */
export const triggerAuctionNotification = async (
  request: FastifyRequest<{ Body: AuctionNotificationBody }>,
  reply: FastifyReply
) => {
  try {
    // Validasi internal API key
    const apiKey = request.headers['x-internal-api-key'];
    if (apiKey !== INTERNAL_API_KEY) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    const { type, auction_id, recipient_id, auction_data } = request.body;

    if (!type || !auction_id || !recipient_id) {
      return reply.status(400).send({ 
        success: false, 
        message: 'Missing required fields: type, auction_id, recipient_id' 
      });
    }

    // Build notification payload berdasarkan type
    const payload = buildNotificationPayload(type, auction_id, auction_data);

    // Send notification
    await notificationService.sendNotification(recipient_id, 'auction', payload);

    request.log.info({ type, auction_id, recipient_id }, 'Auction notification sent');
    
    return reply.send({ success: true, message: 'Notification sent' });

  } catch (error) {
    request.log.error({ error }, 'Failed to send auction notification');
    return reply.status(500).send({ success: false, message: 'Failed to send notification' });
  }
};

/**
 * Build notification payload based on notification type
 */
function buildNotificationPayload(
  type: AuctionNotificationBody['type'], 
  auctionId: number, 
  data: AuctionNotificationBody['auction_data']
) {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:8080';
  
  switch (type) {
    case 'auction_outbid':
      return {
        title: 'Anda Dikalahkan dalam Lelang! 😢',
        body: `Produk "${data.product_name || 'Lelang'}" telah dibid dengan harga Rp ${new Intl.NumberFormat('id-ID').format(data.new_bid_amount || 0)}. Anda dapat mengajukan bid baru.`,
        url: `${baseUrl}/auctions/${auctionId}`,
        icon: '/assets/icons/auction-outbid.png',
        tag: `auction-outbid-${auctionId}`,
        badge: '/assets/icons/badge.png',
        data: { type, auctionId }
      };

    case 'auction_won':
      return {
        title: 'Selamat! Anda Memenangkan Lelang! 🎉',
        body: `Anda telah memenangkan lelang "${data.product_name || 'Produk'}" dengan harga Rp ${new Intl.NumberFormat('id-ID').format(data.final_price || 0)}. Segera checkout.`,
        url: `${baseUrl}/auctions/${auctionId}/checkout`,
        icon: '/assets/icons/auction-won.png',
        tag: `auction-won-${auctionId}`,
        badge: '/assets/icons/badge.png',
        data: { type, auctionId }
      };

    case 'auction_ending_soon':
      return {
        title: 'Lelang Akan Segera Berakhir! ⏰',
        body: `Lelang "${data.product_name || 'Produk'}" akan berakhir dalam beberapa menit. Jangan lewatkan kesempatan untuk bid!`,
        url: `${baseUrl}/auctions/${auctionId}`,
        icon: '/assets/icons/auction-ending.png',
        tag: `auction-ending-${auctionId}`,
        badge: '/assets/icons/badge.png',
        data: { type, auctionId }
      };

    default:
      return {
        title: 'Update Lelang',
        body: `Ada update untuk lelang #${auctionId}`,
        url: `${baseUrl}/auctions/${auctionId}`,
        icon: '/assets/icons/auction.png',
        tag: `auction-${auctionId}`,
        data: { type, auctionId }
      };
  }
}

export default {
  triggerAuctionNotification
};
