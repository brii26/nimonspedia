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