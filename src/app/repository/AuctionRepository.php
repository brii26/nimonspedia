<?php

class AuctionRepository extends BaseRepository {
    protected $table = 'auctions';

    protected function getPrimaryKey() {
        return 'auction_id';
    }

    public function createAuction($data) {
        $data['status'] = 'scheduled'; 
        $data['created_at'] = date('Y-m-d H:i:s');
        return $this->create($data);
    }

    public function findActiveByProductId($productId) {
        $sql = "SELECT auction_id FROM {$this->table} 
                WHERE product_id = ? 
                AND status IN ('scheduled', 'active') 
                LIMIT 1";
        return $this->db->selectOne($sql, [$productId]);
    }

    public function getOverlappingProduct($newStartTime, $newEndTime) {
        $sql = "SELECT p.product_name 
                FROM {$this->table} a
                JOIN products p ON a.product_id = p.product_id
                WHERE a.status IN ('scheduled', 'active')
                AND a.start_time < ?::timestamp 
                AND a.end_time > ?::timestamp
                LIMIT 1"; 
        
        $result = $this->db->selectOne($sql, [$newEndTime, $newStartTime]);
        return $result ? $result['product_name'] : null;
    }

    public function findAllByProductId($productId) {
        $sql = "SELECT 
                    a.auction_id, 
                    a.start_time, 
                    a.end_time, 
                    a.quantity, 
                    a.status,
                    (SELECT COUNT(*) FROM auction_bids ab WHERE ab.auction_id = a.auction_id) as bid_count
                FROM {$this->table} a
                WHERE a.product_id = ?
                ORDER BY a.start_time ASC";
        
        return $this->db->select($sql, [$productId]);
    }

    public function cancelAuction($auctionId, $storeId) {
        $sql = "SELECT a.* FROM auctions a 
                JOIN products p ON a.product_id = p.product_id 
                WHERE a.auction_id = ? AND p.store_id = ?";
        
        $auction = $this->db->selectOne($sql, [$auctionId, $storeId]);

        if (!$auction) {
            throw new Exception("Auction not found or you do not own this product.");
        }

        $bidCountSql = "SELECT COUNT(*) as count FROM auction_bids WHERE auction_id = ?";
        $bids = $this->db->selectOne($bidCountSql, [$auctionId]);
        
        if ($bids['count'] > 0) {
            throw new Exception("Cannot cancel: This auction already has bids.");
        }

        $this->db->beginTransaction();
        try {
            // Restore stock to product
            $restoreStock = "UPDATE products SET stock = stock + ? WHERE product_id = ?";
            $this->db->execute($restoreStock, [$auction['quantity'], $auction['product_id']]);

            // Hard Delete
            $deleteSql = "DELETE FROM auctions WHERE auction_id = ?";
            $this->db->execute($deleteSql, [$auctionId]);
            
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    public function beginTransaction() {
        $this->db->beginTransaction();
    }

    public function commit() {
        $this->db->commit();
    }

    public function rollBack() {
        $this->db->rollBack();
    }
}