<?php

class CartItemRepository extends BaseRepository
{
    /**
     * Nama tabel database.
     * @var string
     */
    protected $table = 'cart_items';

    /**
     * Mengganti primary key untuk tabel ini.
     * @return string
     */
    protected function getPrimaryKey()
    {
        return 'cart_item_id';
    }

    /**
     * Memasukkan atau memperbarui item keranjang untuk pembeli dan produk.
     * Jika item untuk buyer+product yang sama ada, ini akan menambah kuantitasnya.
     *
     * @param int $buyerId
     * @param int $productId
     * @param int $quantity
     * @return int ID item keranjang yang dimasukkan atau diperbarui
     */
    public function addOrUpdate(int $buyerId, int $productId, int $quantity): int
    {
        $sql = "SELECT cart_item_id, quantity FROM {$this->table} WHERE buyer_id = ? AND product_id = ? LIMIT 1";
        $params = [$buyerId, $productId];
        $row = $this->db->selectOne($sql, $params);

        if ($row) {
            $newQty = max(1, (int)$row['quantity'] + $quantity);
            $updateSql = "UPDATE {$this->table} SET quantity = ?, updated_at = NOW() WHERE cart_item_id = ?";
            $updateParams = [$newQty, $row['cart_item_id']];
            
            $this->db->execute($updateSql, $updateParams); 
            
            return (int)$row['cart_item_id'];
        }

        $insertSql = "INSERT INTO {$this->table} (buyer_id, product_id, quantity, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())";
        $insertParams = [$buyerId, $productId, $quantity];

        return $this->db->insert($insertSql, $insertParams);
    }

    /**
     * Menemukan semua item keranjang milik pembeli, digabungkan dengan detail produk.
     *
     * @param int $buyerId
     * @return array
     */
    public function findByBuyerId(int $buyerId): array
    {
        $sql = "SELECT ci.cart_item_id, ci.buyer_id, ci.product_id, ci.quantity, ci.created_at, ci.updated_at,
                       p.product_name, p.price as product_price, p.stock as product_stock
                FROM {$this->table} ci
                LEFT JOIN products p ON p.product_id = ci.product_id
                WHERE ci.buyer_id = ?
                ORDER BY ci.created_at DESC";
        
        return $this->db->select($sql, [$buyerId]);
    }

    /**
     * Menemukan satu item keranjang berdasarkan ID-nya.
     *
     * @param int $id
     * @return array|null
     */
    public function findById(int $id)
    {
        $sql = "SELECT * FROM {$this->table} WHERE {$this->getPrimaryKey()} = ? LIMIT 1";
        return $this->db->selectOne($sql, [$id]);
    }

    /**
     * Memperbarui kuantitas item keranjang tertentu.
     * Jika kuantitas <= 0, item akan dihapus.
     *
     * @param int $cartItemId
     * @param int $quantity
     * @return bool
     */
    public function updateQuantity(int $cartItemId, int $quantity): bool
    {
        if ($quantity <= 0) {
            return $this->delete($cartItemId);
        }
        
        $sql = "UPDATE {$this->table} SET quantity = ?, updated_at = NOW() WHERE {$this->getPrimaryKey()} = ?";
        return $this->db->execute($sql, [$quantity, $cartItemId]);
    }

    /**
     * Menghapus semua item keranjang milik pembeli.
     *
     * @param int $buyerId
     * @return bool
     */
    public function clearByBuyer(int $buyerId): bool
    {
        $sql = "DELETE FROM {$this->table} WHERE buyer_id = ?";
        return $this->db->execute($sql, [$buyerId]);
    }

    /**
     * Menghitung jumlah total item (SUM kuantitas) dalam keranjang pembeli.
     *
     * @param int $buyerId
     * @return int
     */
    public function countByBuyer(int $buyerId): int
    {
        $sql = "SELECT COUNT({$this->getPrimaryKey()}) as cnt FROM {$this->table} WHERE buyer_id = ?";
        $row = $this->db->selectOne($sql, [$buyerId]);
        
        return $row && $row['cnt'] ? (int)$row['cnt'] : 0;
    }
    
    public function sumQuantityByBuyer(int $buyerId): int
    {
        $sql = "SELECT SUM(quantity) as total_units FROM {$this->table} WHERE buyer_id = ?";
        $row = $this->db->selectOne($sql, [$buyerId]);
        
        return $row && $row['total_units'] ? (int)$row['total_units'] : 0;
    }
}