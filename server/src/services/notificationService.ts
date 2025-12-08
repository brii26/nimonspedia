import webpush from 'web-push';
import notificationRepository, { 
  PushSubscriptionData, 
  NotificationPreferences 
} from '../repositories/notificationRepository.js';

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
   * Otomatis mengecek apakah user mengizinkan kategori notifikasi tersebut.
   */
  async sendNotification(
    userId: number, 
    category: 'chat' | 'auction' | 'order', 
    payload: NotificationPayload
  ): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const prefs = await notificationRepository.getPreferences(userId);
      const isEnabled = prefs[`${category}_enabled` as keyof NotificationPreferences];

      if (!isEnabled) {
        console.log(`Notifikasi ${category} di-skip untuk User ${userId} (Preference OFF)`);
        return;
      }

      const subscriptions = await notificationRepository.getSubscriptionsByUser(userId);
      if (subscriptions.length === 0) return;

      console.log(`Sending ${category} notification to User ${userId} (${subscriptions.length} devices)`);
      const notifications = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub as any, JSON.stringify(payload));
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            // 410 Gone: Browser sudah tidak mengenali endpoint ini (User unsubscribe / clear data)
            console.log(`Menghapus subscription expired: ${sub.endpoint}`);
            await notificationRepository.deleteSubscription(sub.endpoint);
          } else {
            console.error('Push Error:', error.message);
          }
        }
      });

      await Promise.all(notifications);

    } catch (error) {
      console.error('Failed to process notification:', error);
    }
  }
}

export default new NotificationService();