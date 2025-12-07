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
}