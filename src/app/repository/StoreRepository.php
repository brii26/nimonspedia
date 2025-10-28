<?php
class StoreRepository extends BaseRepository {
    protected $table = 'stores';

	public function createStore($userId, $name, $desc = null, $storeLogoPath=null) {
		$sql = "INSERT INTO stores (user_id, store_name, store_description, store_logo_path, created_at, updated_at)
				VALUES (?, ?, ?, ?, NOW(), NOW())
				RETURNING store_id, store_name, store_description, store_logo_path, created_at, updated_at";
	
		$row = $this->db->selectOne($sql, [$userId, $name, $desc, $storeLogoPath]);
		if ($row) {
			return $row;
		}

		$createdId = $this->create([
			'user_id' => $userId,
			'store_name' => $name,
			'store_description' => $desc,
			'store_logo_path' => $storeLogoPath,
			'created_at' => date('Y-m-d H:i:s'),
			'updated_at' => date('Y-m-d H:i:s')
		]);

		if ($createdId) {
			return $this->getByIdForDisplay($createdId);
		}
		
		return null;
	}

	protected function getPrimaryKey()
	{
		return 'store_id';
	}

	public function findByUserId($userId) {
        $sql = "SELECT store_id, user_id, store_name, store_description,
                       created_at, updated_at
                  FROM stores
                 WHERE user_id = ?
                 LIMIT 1";
        return $this->db->selectOne($sql, [$userId]);
    }

    public function updateStore($storeId, $name, $desc, $logo) {
        $sql = "UPDATE stores
                   SET store_name = ?, store_description = ?, store_logo_path = ?
                 WHERE store_id = ?
             RETURNING TO_CHAR(updated_at AT TIME ZONE 'Asia/Jakarta','HH24:MI DD-MM-YYYY') AS last_updated";
        return $this->db->selectOne($sql, [$name, $desc, $logo, $storeId]);
    }

    public function getByIdForDisplay($storeId) {
        $sql = "SELECT store_id, store_name, store_description,
                       TO_CHAR(created_at AT TIME ZONE 'Asia/Jakarta','HH24:MI DD-MM-YYYY') AS created_at,
                       TO_CHAR(updated_at AT TIME ZONE 'Asia/Jakarta','HH24:MI DD-MM-YYYY') AS updated_at
                  FROM stores
                 WHERE store_id = ?";
        return $this->db->selectOne($sql, [$storeId]);
    }

    public function removeLogoPath($storeId) {
        $sql = "SELECT store_logo_path FROM stores WHERE store_id = ?";
        $store = $this->db->selectOne($sql, [$storeId]);
        
        if ($store && $store['store_logo_path']) {
            FileService::deleteFile($store['store_logo_path']);
            $sql = "UPDATE stores SET store_logo_path = NULL WHERE store_id = ?";
            $this->db->execute($sql, [$storeId]);
        }
    }
	public function getLogoPath($storeId) {
		$sql = "SELECT store_logo_path FROM stores WHERE store_id = ?";
		$row = $this->db->selectOne($sql, [$storeId]);
		return $row ? $row['store_logo_path'] : null;
	}
}
