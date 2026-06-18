import Queue from 'bull';
import webpush from 'web-push';
import notificationRepository, { PushSubscriptionData } from '../repositories/notificationRepository.js';

interface NotificationJobData {
  userId: number;
  category: 'chat' | 'auction' | 'order';
  payload: any;
}

// 1. Initialize Queue
const notificationQueue = new Queue<NotificationJobData>('notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  defaultJobOptions: {
    attempts: 3, // Retry 3 times if failed
    backoff: {
      type: 'exponential',
      delay: 1000, // Initial delay 1s
    },
    removeOnComplete: true, // Auto remove success jobs
    removeOnFail: false // Keep failed jobs for inspection
  }
});

// 2. Define Worker Process
notificationQueue.process(async (job) => {
  const { userId, category, payload } = job.data;
  console.log(`[Queue] Processing notification job ${job.id} for User ${userId} (${category})`);

  try {
    // 1. Check User Preference (Again, to be safe)
    const prefs = await notificationRepository.getPreferences(userId);
    // Use type assertion or index signature if needed, but preference keys match category + '_enabled'
    const prefKey = `${category}_enabled` as keyof typeof prefs;
    const isEnabled = prefs[prefKey];

    if (!isEnabled) {
      console.log(`[Queue] Notification skipped: User ${userId} disabled ${category} notifications.`);
      return;
    }

    // 2. Get Subscriptions
    const subscriptions = await notificationRepository.getSubscriptionsByUser(userId);
    if (subscriptions.length === 0) {
      console.log(`[Queue] No subscriptions found for User ${userId}`);
      return;
    }

    // 3. Send to all devices
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub as any, JSON.stringify(payload), {
          TTL: 86400 // Store in push service for 24 hours if device is offline
        });
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`[Queue] Removing expired subscription: ${sub.endpoint}`);
          await notificationRepository.deleteSubscription(sub.endpoint);
        } else {
          console.error(`[Queue] WebPush Error for User ${userId}:`, error.message);
          // Re-throw to trigger retry mechanism ONLY if it's a server error (5xx), 
          // but usually web-push errors are final (4xx). 
          // Bull will retry if we throw. Let's only throw for actual network/server issues.
          if (error.statusCode >= 500) {
             throw error; 
          }
        }
      }
    });

    await Promise.all(sendPromises);
    console.log(`[Queue] Job ${job.id} completed.`);

  } catch (error: any) {
    console.error(`[Queue] Job ${job.id} failed:`, error.message);
    throw error; // Trigger Bull retry
  }
});

// Log errors
notificationQueue.on('error', (error) => {
  console.error('[Queue] Notification Queue Error:', error);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`[Queue] Job ${job.id} failed after attempts:`, err.message);
});

export default notificationQueue;
