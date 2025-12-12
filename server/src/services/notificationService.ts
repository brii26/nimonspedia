import webpush from 'web-push';
import notificationRepository, { 
  PushSubscriptionData, 
  NotificationPreferences 
} from '../repositories/notificationRepository.js';
import notificationQueue from '../queues/notificationQueue.js';

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  [key: string]: any;
}

class NotificationService {
  private isInitialized = false;

  constructor() {
    this.init();
  }

  /**
   * Inisialisasi VAPID Keys dari Environment Variables.
   * Harus dipanggil sekali saat server start.
   */
  private init() {
    if (this.isInitialized) return;

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    if (!publicKey || !privateKey || !subject) {
      console.warn('WARNING: VAPID Keys belum lengkap di .env. Fitur Push Notification tidak akan jalan.');
      return;
    }

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.isInitialized = true;
      console.log('Notification Service Initialized with VAPID');
    } catch (error) {
      console.error('Failed to set VAPID details:', error);
    }
  }

  /**
   * Mengambil Public Key untuk dikirim ke Frontend.
   * Browser butuh ini untuk proses subscribe.
   */
  getPublicKey(): string {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) throw new Error('VAPID Public Key not configured');
    return key;
  }

  /**
   * Menyimpan data langganan user (dari Frontend).
   */
  async subscribe(userId: number, subscription: PushSubscriptionData): Promise<void> {
    if (!subscription.endpoint || !subscription.keys) {
      throw new Error('Invalid subscription object');
    }
    await notificationRepository.saveSubscription(userId, subscription);
  }

  /**
   * Mengupdate preferensi notifikasi user.
   */
  async updatePreferences(userId: number, prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    return await notificationRepository.updatePreferences(userId, prefs);
  }

  /**
   * Mengambil preferensi notifikasi user saat ini.
   */
  async getPreferences(userId: number): Promise<NotificationPreferences> {
    return await notificationRepository.getPreferences(userId);
  }

  /**
   * Mengirim notifikasi ke User tertentu.
   * Menggunakan Queue (Bull) untuk reliability.
   */
  async sendNotification(
    userId: number, 
    category: 'chat' | 'auction' | 'order', 
    payload: NotificationPayload
  ): Promise<void> {
    if (!this.isInitialized) {
      console.warn('[Notification] Skipped: VAPID not initialized');
      return;
    }

    try {
      // Masukkan ke Queue (Fire and Forget)
      await notificationQueue.add({
        userId,
        category,
        payload
      });
      console.log(`[Notification] Job queued for User ${userId} (${category})`);
    } catch (error) {
      console.error('[Notification] Failed to queue notification:', error);
    }
  }
}

export default new NotificationService();