<?php

class OrderRepository extends BaseRepository {
    protected $table = 'orders';

    protected function getPrimaryKey() {
        return 'order_id';
    }

    public function getTotalOrders($storeId) {
        $sql = "SELECT COUNT(*) AS total_orders FROM {$this->table} WHERE store_id = ?";
        $row = $this->db->selectOne($sql, [$storeId]);
        return isset($row['total_orders']) ? (int)$row['total_orders'] : 0;
    }

    public function getOrderPrice($orderId) {
        $sql = "SELECT total_price FROM {$this->table} WHERE order_id = ?";
        $row = $this->db->selectOne($sql, [$orderId]);
        return isset($row['total_price']) ? (float)$row['total_price'] : 0.0;
    }

    public function getPendingOrders($storeId) {
        $sql = "SELECT COUNT(*) AS total_orders FROM {$this->table} WHERE store_id = ? AND status = 'waiting_approval'";
        $row = $this->db->selectOne($sql, [$storeId]);
        return isset($row['total_orders']) ? (int)$row['total_orders'] : 0;
    }

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

    /**
     * Get a paginated list of orders for a specific buyer.
     *
     * @param int $buyerId The ID of the buyer
     * @param int $page The current page number
     * @param int $perPage Number of items per page
     * @param string|null $status Filter by order status
     * @return array Associative array with 'data' (orders) and 'total_pages'
     */
    public function getOrdersByBuyer(int $buyerId, int $page = 1, int $perPage = 10, ?string $status = null): array {
        $offset = ($page - 1) * $perPage;
        
        $params = [$buyerId];
        $countParams = [$buyerId];

        // Base query
        $sql = "
            SELECT o.*, s.store_name
            FROM {$this->table} o
            JOIN stores s ON o.store_id = s.store_id
            WHERE o.buyer_id = ?
        ";
        
        // Base query for counting
        $countSql = "
            SELECT COUNT(*) as total
            FROM {$this->table} o
            WHERE o.buyer_id = ?
        ";

        // Add status filter if provided
        if ($status) {
            $sql .= " AND o.status = ?";
            $countSql .= " AND o.status = ?";
            $params[] = $status;
            $countParams[] = $status;
        }

        // Add sorting and pagination to main query
        $sql .= " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $perPage;
        $params[] = $offset;

        // Execute queries
        $orders = $this->db->select($sql, $params);
        $totalRow = $this->db->selectOne($countSql, $countParams);
        $total = $totalRow['total'] ?? 0;

        return [
            'data' => $orders,
            'total_pages' => ceil($total / $perPage)
        ];
    }

    /**
     * Get the full details for a single order, verifying it belongs to the buyer.
     *
     * @param int $orderId The ID of the order
     * @param int $buyerId The ID of the buyer (for verification)
     * @return array|null The complete order details (with items)
     */
    public function getBuyerOrderDetails(int $orderId, int $buyerId): ?array {
        $sql = "
            SELECT o.*, s.store_name, u.name as buyer_name, u.address as buyer_address
            FROM {$this->table} o
            JOIN stores s ON o.store_id = s.store_id
            JOIN users u ON o.buyer_id = u.user_id
            WHERE o.order_id = ? AND o.buyer_id = ?
        ";
        
        $order = $this->db->selectOne($sql, [$orderId, $buyerId]);

        if (!$order) {
            return null;
        }

        $order['items'] = $this->getOrderItems($orderId);

        return $order;
    }

    /**
     * Mark an order as received when buyer confirms delivery.
     * Only allowed when the order belongs to the buyer and is currently on_delivery
     * and the delivery_time has already passed.
     *
     * @param int $orderId
     * @param int $buyerId
     * @return bool
     */
    public function confirmReceived(int $orderId, int $buyerId): bool {
        $sql = "
            UPDATE {$this->table}
            SET status = 'received', received_at = CURRENT_TIMESTAMP
            WHERE order_id = ? AND buyer_id = ? AND status = 'on_delivery' AND delivery_time <= CURRENT_TIMESTAMP
        ";
        return $this->db->execute($sql, [$orderId, $buyerId]) > 0;
    }
    
    /**
     * Process the entire checkout transaction.
     *
     * @param int $buyerId
     * @param array $items Array of cart items from CartService
     * @param int $totalPrice Total price of the entire cart
     * @return array Array of the newly created order records
     * @throws ValidationException
     * @throws Exception
     */
    public function processCheckout(int $buyerId, array $items, int $totalPrice): array {
        try {
            $buyerSql = "SELECT user_id, balance, address FROM users WHERE user_id = ? FOR UPDATE";
            $buyer = $this->db->selectOne($buyerSql, [$buyerId]);

            if (!$buyer || $buyer['balance'] < $totalPrice) {
                throw new ValidationException("Saldo Anda tidak mencukupi.");
            }
            
            $itemsByStore = [];
            foreach ($items as $item) {
                $prodSql = "SELECT store_id FROM products WHERE product_id = ?";
                $product = $this->db->selectOne($prodSql, [$item['product_id']]);
                if (!$product) {
                    throw new ValidationException("Produk '{$item['product_name']}' tidak ditemukan.");
                }
                $storeId = $product['store_id'];
                $itemsByStore[$storeId][] = $item;
            }

            $createdOrders = [];

            foreach ($itemsByStore as $storeId => $storeItems) {
                $storeTotalPrice = 0;
                foreach ($storeItems as $item) {
                    $storeTotalPrice += $item['subtotal'];
                }

                // 5. Create the main 'orders' record for this store
                $orderSql = "
                    INSERT INTO {$this->table} (buyer_id, store_id, total_price, status, shipping_address, created_at)
                    VALUES (?, ?, ?, 'waiting_approval', ?, CURRENT_TIMESTAMP)
                    RETURNING order_id, created_at, status, total_price
                ";
                $newOrder = $this->db->selectOne($orderSql, [
                    $buyerId,
                    $storeId,
                    $storeTotalPrice,
                    $buyer['address'] // Use buyer's main address
                ]);
                
                $newOrderId = $newOrder['order_id'];
                if (!$newOrderId) {
                    throw new Exception("Gagal membuat data order utama.");
                }

                // 6. Loop through items for this store and process them
                foreach ($storeItems as $item) {
                    // 7. Lock product row and check stock
                    $stockSql = "SELECT product_name, stock FROM products WHERE product_id = ? FOR UPDATE";
                    $product = $this->db->selectOne($stockSql, [$item['product_id']]);

                    if (!$product || $product['stock'] < $item['quantity']) {
                        throw new ValidationException("Stok untuk '{$product['product_name']}' tidak mencukupi.");
                    }

                    // 8. Insert into 'order_items'
                    $itemSql = "
                        INSERT INTO order_items (order_id, product_id, quantity, price_at_order, subtotal)
                        VALUES (?, ?, ?, ?, ?)
                    ";
                    $price = $item['product_price'];
                    $quantity = $item['quantity'];
                    $subtotal = $price * $quantity;
                    
                    $this->db->query($itemSql, [
                        $newOrderId,
                        $item['product_id'],
                        $quantity,
                        $price,
                        $subtotal
                    ]);
                    $updateStockSql = "UPDATE products SET stock = stock - ? WHERE product_id = ?";
                    $this->db->query($updateStockSql, [$item['quantity'], $item['product_id']]);
                }
                
                $createdOrders[] = $newOrder;
            }

            $updateBalanceSql = "
                UPDATE users 
                SET balance = balance - ?
                WHERE user_id = ?
            ";
            $this->db->query($updateBalanceSql, [$totalPrice, $buyerId]);
            
            return $createdOrders;

        } catch (Exception $e) {
            throw $e;
        }
    }
}
