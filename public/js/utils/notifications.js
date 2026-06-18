/**
 * notifications.js
 * Handle Web Push Subscription di Halaman PHP
 */

// Helper: Convert VAPID Key
function urlBase64ToUint8Array(base64String) {
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

const NotificationApp = {
    publicKey: null,

    async init() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push messaging not supported');
            return;
        }

        // 1. Register Service Worker (Global scope)
        try {
            await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker Registered from PHP');
        } catch (err) {
            console.error('SW Register failed:', err);
        }

        // 2. Load Preferensi Awal
        await this.loadPreferences();

        // 3. Cek Status Subscription
        await this.checkSubscriptionStatus();

        // 4. Bind Event Listeners
        this.bindEvents();
    },

    async loadPreferences() {
        try {
            // Panggil API Node.js via Nginx Proxy
            const res = await fetch('/api/node/notifications/preferences');
            if (res.ok) {
                const json = await res.json();
                const prefs = json.data;
                
                // Update UI Checkboxes
                document.getElementById('toggle-chat').checked = prefs.chat_enabled;
                document.getElementById('toggle-auction').checked = prefs.auction_enabled;
                document.getElementById('toggle-order').checked = prefs.order_enabled;
            }
        } catch (err) {
            console.error('Failed to load preferences:', err);
        }
    },

    async checkSubscriptionStatus() {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        
        const btnEnable = document.getElementById('btn-enable-notif');
        const settingsArea = document.getElementById('notification-settings-area');

        if (sub) {
            btnEnable.style.display = 'none';
            settingsArea.style.display = 'block';
        } else {
            btnEnable.style.display = 'block';
            settingsArea.style.display = 'none';
        }
    },

    bindEvents() {
        document.getElementById('btn-enable-notif').addEventListener('click', async () => {
            await this.subscribe();
        });

        // Toggles
        ['chat', 'auction', 'order'].forEach(type => {
            document.getElementById(`toggle-${type}`).addEventListener('change', (e) => {
                this.updatePreference(type, e.target.checked);
            });
        });
    },

    async subscribe() {
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Notification permission denied.');
                return;
            }

            const keyRes = await fetch('/api/node/notifications/vapid-public-key');
            const keyJson = await keyRes.json();
            this.publicKey = keyJson.publicKey;

            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(this.publicKey)
            });

            await fetch('/api/node/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: sub })
            });

            alert('Notifications enabled successfully!');
            this.checkSubscriptionStatus();

        } catch (err) {
            console.error('Subscribe error:', err);
            alert('Failed to enable notifications.');
        }
    },

    async updatePreference(key, value) {
        try {
            await fetch('/api/node/notifications/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [`${key}_enabled`]: value })
            });
            console.log(`Preference ${key} updated to ${value}`);
        } catch (err) {
            console.error('Update pref error:', err);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    NotificationApp.init();
});