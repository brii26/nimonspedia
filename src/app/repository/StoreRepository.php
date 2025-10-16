<?php
class StoreRepository extends BaseRepository {
    protected $table = 'stores';
    protected function getPrimaryKey() { return 'store_id'; }

    public function findByUserId($userId) {
        $sql = "SELECT store_id, user_id, store_name, store_description,
                       created_at, updated_at
                  FROM stores
                 WHERE user_id = ?
                 LIMIT 1";
        return $this->db->selectOne($sql, [$userId]);
    }

    public function updateStore($storeId, $name, $desc) {
        $sql = "UPDATE stores
                   SET store_name = ?, store_description = ?
                 WHERE store_id = ?
             RETURNING TO_CHAR(updated_at AT TIME ZONE 'Asia/Jakarta','HH24:MI DD-MM-YYYY') AS last_updated";
        return $this->db->selectOne($sql, [$name, $desc, $storeId]);
    }

    public function getByIdForDisplay($storeId) {
        $sql = "SELECT store_id, store_name, store_description,
                       TO_CHAR(created_at AT TIME ZONE 'Asia/Jakarta','HH24:MI DD-MM-YYYY') AS created_at,
                       TO_CHAR(updated_at AT TIME ZONE 'Asia/Jakarta','HH24:MI DD-MM-YYYY') AS updated_at
                  FROM stores
                 WHERE store_id = ?";
        return $this->db->selectOne($sql, [$storeId]);
    }

    public function findProducts($storeId, $limit = 12, $offset = 0) {
        $limit  = max(0, (int)$limit); 
        $offset = max(0, (int)$offset);
        $sql = "SELECT * FROM products
                 WHERE store_id = ? AND deleted_at IS NULL
                 ORDER BY created_at DESC
                 LIMIT {$limit} OFFSET {$offset}";
        return $this->db->select($sql, [$storeId]);
    }
}
