import api from './api/axios.js';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const notificationService = {
  // 1. Register Service Worker
  async registerWorker() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push messaging is not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker Registered');
      return registration;
    } catch (error) {
      console.error('Service Worker Error:', error);
      throw error;
    }
  },

  // 2. Proses Subscribe (Minta Izin -> Ambil Key -> Kirim ke Backend)
  async subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission not granted for Notification');
      }

      const response = await api.get('/notifications/vapid-public-key');
      const publicKey = response.data.publicKey;

      if (!publicKey) throw new Error('VAPID Public Key not found');

      const convertedVapidKey = urlBase64ToUint8Array(publicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      console.log('Push Subscription Object:', subscription);

      await api.post('/notifications/subscribe', { subscription });
      
      console.log('Subscribed to Server successfully');
      return true;

    } catch (error) {
      console.error('Failed to subscribe:', error);
      return false;
    }
  },

  async isSubscribed() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  }
};