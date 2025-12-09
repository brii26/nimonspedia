<?php

/**
 * NotificationService
 * 
 * PHP Service untuk memanggil Node.js notification API.
 * Digunakan untuk trigger push notification dari PHP backend.
 */
class NotificationService {
    private static $nodeUrl;
    private static $apiKey;

    /**
     * Initialize configuration
     */
    private static function init(): void {
        if (self::$nodeUrl === null) {
            // Node.js internal URL (dalam Docker network)
            self::$nodeUrl = getenv('NODE_INTERNAL_URL') ?: 'http://node-server:3000';
            self::$apiKey = getenv('INTERNAL_API_KEY') ?: 'nimonspedia-internal-key';
        }
    }

    /**
     * Send order notification via Node.js API
     * 
     * @param string $type Type of notification (order_approved, order_rejected, etc.)
     * @param int $orderId Order ID
     * @param int $recipientId User ID who will receive the notification
     * @param array $orderData Additional order data for notification content
     * @return bool Success status
     */
    public static function sendOrderNotification(
        string $type, 
        int $orderId, 
        int $recipientId, 
        array $orderData = []
    ): bool {
        self::init();

        $payload = [
            'type' => $type,
            'order_id' => $orderId,
            'recipient_id' => $recipientId,
            'order_data' => $orderData
        ];

        return self::callNodeApi('/internal/notify/order', $payload);
    }

    /**
     * Notify buyer that their order was approved by seller
     */
    public static function notifyOrderApproved(int $orderId, int $buyerId, string $storeName): bool {
        return self::sendOrderNotification('order_approved', $orderId, $buyerId, [
            'store_name' => $storeName
        ]);
    }

    /**
     * Notify buyer that their order was rejected by seller
     */
    public static function notifyOrderRejected(int $orderId, int $buyerId, string $storeName, string $reason): bool {
        return self::sendOrderNotification('order_rejected', $orderId, $buyerId, [
            'store_name' => $storeName,
            'reject_reason' => $reason
        ]);
    }

    /**
     * Notify buyer that their order is on delivery
     */
    public static function notifyOrderOnDelivery(int $orderId, int $buyerId, string $storeName): bool {
        return self::sendOrderNotification('order_on_delivery', $orderId, $buyerId, [
            'store_name' => $storeName
        ]);
    }

    /**
     * Notify seller that there's a new order waiting for approval
     */
    public static function notifyOrderWaitingApproval(int $orderId, int $sellerId, string $buyerName): bool {
        return self::sendOrderNotification('order_waiting_approval', $orderId, $sellerId, [
            'buyer_name' => $buyerName
        ]);
    }

    /**
     * Notify seller that buyer has received the order
     */
    public static function notifyOrderReceived(int $orderId, int $sellerId, string $buyerName): bool {
        return self::sendOrderNotification('order_received', $orderId, $sellerId, [
            'buyer_name' => $buyerName
        ]);
    }

    /**
     * Call Node.js API endpoint
     * 
     * @param string $endpoint API endpoint path
     * @param array $data Request body
     * @return bool Success status
     */
    private static function callNodeApi(string $endpoint, array $data): bool {
        $url = self::$nodeUrl . $endpoint;

        $ch = curl_init($url);
        
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-Internal-Api-Key: ' . self::$apiKey
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5, // 5 second timeout
            CURLOPT_CONNECTTIMEOUT => 3 // 3 second connection timeout
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);

        if ($error) {
            error_log("NotificationService Error: $error");
            return false;
        }

        if ($httpCode !== 200) {
            error_log("NotificationService HTTP Error: $httpCode - $response");
            return false;
        }

        $result = json_decode($response, true);
        return isset($result['success']) && $result['success'] === true;
    }
}
