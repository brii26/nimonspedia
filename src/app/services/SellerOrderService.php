<?php

class SellerOrderService {
    protected $orderRepo;
	protected $storeService;

    public function __construct() {
        $this->orderRepo = new OrderRepository();
		$this->storeService = new StoreService();
    }

    public function getOrders(int $storeId, ?string $status = null, ?string $search = null, int $page = 1): array {
        $perPage = 10;
        $result = $this->orderRepo->getOrdersByStore($storeId, $status, $search, $page, $perPage);

        foreach ($result['orders'] as &$order) {
            $order['items'] = $this->orderRepo->getOrderItems($order['order_id']);
        }
        
        return $result;
    }

    public function getOrderDetail(int $orderId, int $storeId): ?array {
        $order = $this->orderRepo->getOrder($orderId, $storeId);
        if (!$order) {
            return null;
        }

        $order['items'] = $this->orderRepo->getOrderItems($orderId);
        return $order;
    }

    public function approveOrder(int $orderId, int $storeId): bool {
        $order = $this->orderRepo->getOrder($orderId, $storeId);
        if (!$order || $order['status'] !== 'waiting_approval') {
            return false;
        }
        
        $success = $this->orderRepo->approveOrder($orderId);
        
        // Send notification to buyer (non-blocking)
        if ($success) {
            try {
                $store = $this->storeService->getStoreById($storeId);
                $storeName = $store['store_name'] ?? 'Toko';
                NotificationService::notifyOrderApproved($orderId, (int)$order['buyer_id'], $storeName);
            } catch (Exception $e) {
                error_log('Notification error: ' . $e->getMessage());
            }
        }
        
        return $success;
    }

    public function rejectOrder(int $orderId, int $storeId, string $reason): bool {
        $order = $this->orderRepo->getOrder($orderId, $storeId);
        if (!$order || $order['status'] !== 'waiting_approval') {
            return false;
        }

        $refunded = $this->orderRepo->refundBuyerBalance($orderId);
        $rejected = $this->orderRepo->rejectOrder($orderId, $reason);

        $success = ($refunded && $rejected);
        
        // Send notification to buyer (non-blocking)
        if ($success) {
            try {
                $store = $this->storeService->getStoreById($storeId);
                $storeName = $store['store_name'] ?? 'Toko';
                NotificationService::notifyOrderRejected($orderId, (int)$order['buyer_id'], $storeName, $reason);
            } catch (Exception $e) {
                error_log('Notification error: ' . $e->getMessage());
            }
        }

        return $success;
    }

    public function setDeliveryTime(int $orderId, int $storeId, string $deliveryTime): bool {
        $order = $this->orderRepo->getOrder($orderId, $storeId);
        if (!$order || $order['status'] !== 'approved') {
            return false;
        }

        $success = $this->orderRepo->setDelivery($orderId, $deliveryTime);
        
        // Send notification to buyer (non-blocking)
        if ($success) {
            try {
                $store = $this->storeService->getStoreById($storeId);
                $storeName = $store['store_name'] ?? 'Toko';
                NotificationService::notifyOrderOnDelivery($orderId, (int)$order['buyer_id'], $storeName);
            } catch (Exception $e) {
                error_log('Notification error: ' . $e->getMessage());
            }
        }

        return $success;
    }
}