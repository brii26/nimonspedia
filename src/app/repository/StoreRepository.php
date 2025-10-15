<?php

class StoreRepository extends BaseRepository {
	protected $table = 'stores';

	protected function getPrimaryKey() {
		return 'store_id';
	}

	public function findByUserId($userId) {
		$sql = "SELECT * FROM stores WHERE user_id = ? LIMIT 1";
		return $this->db->selectOne($sql, [$userId]);
	}

	public function getBasicStats($storeId) {
		$sql = "SELECT 
			COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_products,
			COUNT(*) FILTER (WHERE deleted_at IS NULL AND stock > 0) AS active_products
			FROM products WHERE store_id = ?";
		return $this->db->selectOne($sql, [$storeId]);
	}

	public function findProducts($storeId, $limit = 12, $offset = 0) {
		$sql = "SELECT * FROM products WHERE store_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT {$limit} OFFSET {$offset}";
		return $this->db->select($sql, [$storeId]);
	}
}