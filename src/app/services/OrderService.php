<?php

class OrderService {
    protected $orderRepo;

    public function __construct() {
        $this->orderRepo = new OrderRepository();
    }

    public function getOrders(int $storeId, ?string $status = null, ?string $search = null, int $page = 1): array {
        $perPage = 10;
        $result = $this->orderRepo->getOrdersByStore($storeId, $status, $search, $page, $perPage);
        
        // Get order items for each order
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

        return $this->orderRepo->approveOrder($orderId);
    }

    public function rejectOrder(int $orderId, int $storeId, string $reason): bool {
        $order = $this->orderRepo->getOrder($orderId, $storeId);
        if (!$order || $order['status'] !== 'waiting_approval') {
            return false;
        }
        // Perform refund and reject without explicit transaction here
        $refunded = $this->orderRepo->refundBuyerBalance($orderId);
        $rejected = $this->orderRepo->rejectOrder($orderId, $reason);

        return ($refunded && $rejected);
    }

    public function setDeliveryTime(int $orderId, int $storeId, string $deliveryTime): bool {
        $order = $this->orderRepo->getOrder($orderId, $storeId);
        if (!$order || $order['status'] !== 'approved') {
            return false;
        }

        return $this->orderRepo->setDelivery($orderId, $deliveryTime);
    }
}