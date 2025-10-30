<?php

class OrderRepository extends BaseRepository {
    protected $table = 'orders';

    protected function getPrimaryKey() {
        return 'order_id';
    }

    /**
     * Returns total number of orders for a store
     * @param int $storeId
     * @return int
     */
    public function getTotalOrders($storeId) {
        $sql = "SELECT COUNT(*) AS total_orders FROM {$this->table} WHERE store_id = ?";
        $row = $this->db->selectOne($sql, [$storeId]);
        return isset($row['total_orders']) ? (int)$row['total_orders'] : 0;
    }

    /**
     * Returns total revenue for a store (only orders with status 'received')
     * @param int $storeId
     * @return int
     */
    public function getRevenue($storeId) {
        $sql = "SELECT COALESCE(SUM(total_price), 0) AS revenue FROM {$this->table} WHERE store_id = ? AND status = 'received'";
        $row = $this->db->selectOne($sql, [$storeId]);
        return isset($row['revenue']) ? (int)$row['revenue'] : 0;
    }

    /**
     * Get orders for a store with optional filtering and search
     */
    public function getOrdersByStore(int $storeId, ?string $status = null, ?string $search = null, int $page = 1, int $perPage = 10) {
        $offset = ($page - 1) * $perPage;
        $params = [$storeId];
        $paramIndex = 2;

        $sql = "
            SELECT o.*, u.name as buyer_name, u.email as buyer_email
            FROM orders o
            JOIN users u ON o.buyer_id = u.user_id
            WHERE o.store_id = ?
        ";

        if ($status) {
            $sql .= " AND o.status = ?";
            $params[] = $status;
            $paramIndex++;
        }

        if ($search) {
            $sql .= " AND (o.order_id::text LIKE ? OR u.name ILIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $paramIndex += 2;
        }

        $sql .= " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $perPage;
        $params[] = $offset;

        $orders = $this->db->select($sql, $params);

        // Get total count for pagination
        $countSql = "
            SELECT COUNT(*) as total 
            FROM orders o 
            JOIN users u ON o.buyer_id = u.user_id 
            WHERE o.store_id = ?
        ";
        $countParams = [$storeId];

        if ($status) {
            $countSql .= " AND o.status = ?";
            $countParams[] = $status;
        }

        if ($search) {
            $countSql .= " AND (o.order_id::text LIKE ? OR u.name ILIKE ?)";
            $countParams[] = "%$search%";
            $countParams[] = "%$search%";
        }

        $total = $this->db->select($countSql, $countParams)[0]['total'];

        return [
            'orders' => $orders,
            'total' => $total,
            'totalPages' => ceil($total / $perPage)
        ];
    }

    /**
     * Get order items with product details
     */
    public function getOrderItems(int $orderId): array {
        $sql = "
            SELECT oi.*, p.product_name, p.main_image_path
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?
            ORDER BY oi.order_item_id ASC
        ";
        return $this->db->select($sql, [$orderId]);
    }

    /**
     * Approve a pending order
     */
    public function approveOrder(int $orderId): bool {
        $sql = "
            UPDATE orders 
            SET status = 'approved', 
                confirmed_at = CURRENT_TIMESTAMP 
            WHERE order_id = ? 
            AND status = 'waiting_approval'
        ";
        return $this->db->query($sql, [$orderId])->rowCount() > 0;
    }

    /**
     * Reject an order and set rejection reason
     */
    public function rejectOrder(int $orderId, string $reason): bool {
        $sql = "
            UPDATE orders 
            SET status = 'rejected',
                reject_reason = ?,
                confirmed_at = CURRENT_TIMESTAMP
            WHERE order_id = ? 
            AND status = 'waiting_approval'
        ";
        return $this->db->query($sql, [$reason, $orderId])->rowCount() > 0;
    }

    /**
     * Set delivery time and update status to on_delivery
     */
    public function setDelivery(int $orderId, string $deliveryTime): bool {
        $sql = "
            UPDATE orders 
            SET status = 'on_delivery',
                delivery_time = ?
            WHERE order_id = ? 
            AND status = 'approved'
        ";
        return $this->db->query($sql, [$deliveryTime, $orderId])->rowCount() > 0;
    }

    /**
     * Get detailed order information for a specific store
     */
    public function getOrder(int $orderId, int $storeId): ?array {
        $sql = "
            SELECT o.*, u.name as buyer_name, u.email as buyer_email, u.address as buyer_address
            FROM orders o
            JOIN users u ON o.buyer_id = u.user_id
            WHERE o.order_id = ? AND o.store_id = ?
        ";
        $orders = $this->db->select($sql, [$orderId, $storeId]);
        return !empty($orders) ? $orders[0] : null;
    }

    /**
     * Refund buyer's balance for rejected orders
     */
    public function refundBuyerBalance(int $orderId): bool {
        $sql = "
            UPDATE users u
            SET balance = balance + o.total_price
            FROM orders o
            WHERE o.buyer_id = u.user_id
            AND o.order_id = ?
            AND o.status = 'waiting_approval'
        ";
        return $this->db->query($sql, [$orderId])->rowCount() > 0;
    }
}
