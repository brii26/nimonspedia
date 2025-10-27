<?php
class StoreRepository extends BaseRepository {
    protected $table = 'stores';

	public function createStore($storeData) {
		$userId = $storeData['user_id'];
		$name = $storeData['store_name'];
		$store_logo_path = $storeData['store_logo_path'];
		$desc = $storeData['store_description'];

		$payload =[
			'user_id' => $userId,
			'store_name' => $name,
			'store_logo_path' => $store_logo_path,
			'store_description' => $desc,
			'created_at' => date('Y-m-d H:i:s'),
			'updated_at' => date('Y-m-d H:i:s')
		];

		return $this->create($payload);
	}

	protected function getPrimaryKey()
	{
		return 'store_id';
	}

	public function findByUserId($userId) {
        $sql = "SELECT store_id, store_name, store_logo_path, store_description,
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

	public function getTotalProducts(int $storeId): int
    {
        $row = $this->db->selectOne(
            "SELECT COUNT(*) AS total_products FROM products WHERE store_id = ? AND deleted_at IS NULL",
            [$storeId]
        );
        return (int)($row['total_products'] ?? 0);
    }

    public function getTotalOrders(int $storeId): int
    {
        $row = $this->db->selectOne(
            "SELECT COUNT(*) AS total_orders FROM orders WHERE store_id = ?",
            [$storeId]
        );
        return (int)($row['total_orders'] ?? 0);
    }

    public function getRevenue(int $storeId): int
    {
        $row = $this->db->selectOne(
            "SELECT COALESCE(SUM(total_price), 0) AS revenue FROM orders WHERE store_id = ? AND status = 'received'",
            [$storeId]
        );
        return (int)($row['revenue'] ?? 0);
    }

    public function getLowStockCount(int $storeId, int $threshold = 10): int
    {
        $row = $this->db->selectOne(
            "SELECT COUNT(product_id) AS low_stocks FROM products WHERE store_id = ? AND stock > 0 AND stock < ?",
            [$storeId, $threshold]
        );
        return (int)($row['low_stocks'] ?? 0);
    }

    public function getStoreInfo(int $storeId): array
    {
        $sql = "SELECT store_id, store_name, store_description, store_logo_path,
                    TO_CHAR(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta', 'HH24:MI DD-MM-YYYY') AS created_at,
                    TO_CHAR(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta', 'HH24:MI DD-MM-YYYY') AS updated_at
                FROM stores
                WHERE store_id = ?
                LIMIT 1";
        return $this->db->selectOne($sql, [$storeId]) ?? [];
    }

    public function getStatsByStoreId(int $storeId): array
    {
        return [
            'total_products' => $this->getTotalProducts($storeId),
            'total_orders'   => $this->getTotalOrders($storeId),
            'revenue'        => $this->getRevenue($storeId),
            'low_stocks'     => $this->getLowStockCount($storeId),
        ];
    }

}
