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
}
