<?php


class ProductRepository extends BaseRepository {

    protected $table = 'products';

    public function update($id, $data) {
        if (empty($data)) {
            return false;
        }
        $fields = array_keys($data);
        $setClause = implode(' = ?, ', $fields) . ' = ?';
        $primaryKey = $this->getPrimaryKey();
        $sql = "UPDATE {$this->table} SET {$setClause} WHERE {$primaryKey} = ? RETURNING {$primaryKey}";
        $params = array_values($data);
        $params[] = $id;
        $result = $this->db->selectOne($sql, $params);
        return $result ? $result[$primaryKey] : false;
    }
    
    /**
     * Override primary key for users table
     * @return string The primary key column name for the products table.
     */
    protected function getPrimaryKey() {
        return 'product_id';
    }

    /**
     * Provides comprehensive search and filtering capabilities for products.
     * This method coordinates the building of query conditions, counting total results,
     * and fetching a paginated list of products based on the provided options.
     *
     * @param array $options An associative array of filter options, including:
     * - 'page' (int): The current page number for pagination.
     * - 'perPage' (int): The number of items to display per page.
     * - 'searchTerm' (string): A keyword to search in product names.
     * - 'categoryId' (int): The ID of the category to filter by.
     * - 'minPrice' (float): The minimum price for the price range filter.
     * - 'maxPrice' (float): The maximum price for the price range filter.
     * @return array An associative array containing paginated data and metadata.
     */
	public function searchAndFilter($options = []) {
		$page    = max(1, (int)($options['page'] ?? 1));
        
        // Check for "unlimited" signal (-1)
        $rawPerPage = (int)($options['perPage'] ?? 12);
        if ($rawPerPage === -1) {
            $perPage = -1;
            $offset = 0;
        } else {
            $perPage = max(1, $rawPerPage);
            $offset  = ($page - 1) * $perPage;
        }

        $includeCategories = !empty($options['includeCategories']);
	
		[$whereSql, $filterParams] = $this->buildFilterConditions($options);
	
		$sortBy  = $options['sortBy'] ?? null;
		$sortDir = (strtoupper($options['sortDir'] ?? 'ASC') === 'DESC') ? 'DESC' : 'ASC';
		$searchTerm = $options['searchTerm'] ?? '';
	
		$orderSql = '';
		$sortParams = [];

		if ($sortBy === 'name')  {
			$orderSql = "ORDER BY p.product_name {$sortDir}";
		} elseif ($sortBy === 'price') {
			$orderSql = "ORDER BY p.price {$sortDir}";
		} elseif ($sortBy === 'stock') {
			$orderSql = "ORDER BY p.stock {$sortDir}";
		} elseif (empty($sortBy) && !empty($searchTerm)) {
			$orderSql = "
				ORDER BY 
					CASE 
						WHEN p.product_name ILIKE ? THEN 1 
						ELSE 2
					END ASC, 
					p.product_name ASC
			";
			$sortParams[] = $searchTerm . '%';
		}
	
		$total = $this->countFilteredProducts($whereSql, $filterParams);

		$allParams = array_merge($filterParams, $sortParams);
        if (!empty($sortParams)) {
            $allParams = array_merge($allParams, $sortParams);
        }
		$records = $this->getFilteredProductsPage($whereSql, $allParams, $perPage, $offset, $orderSql, $includeCategories);
	
		return [
			'data' => $records,
			'current_page' => $page,
			'per_page' => $perPage,
			'total' => (int)$total,
			'total_pages' => ($total && $perPage > 0) ? (int)ceil($total / $perPage) : 1,
		];
	}
	

    /**
     * [Private Helper] Constructs the WHERE clause and parameter array for filtering.
     * 
     * @param array $options The filter options passed from the public method.
     * @return array An array containing two elements: the SQL WHERE string and an array of parameters.
     */
    private function buildFilterConditions($options) {
        $whereClauses = ['p.deleted_at IS NULL'];
        $params = [];

		if (!empty($options['searchTerm'])) {
            $terms = preg_split('/\s+/', trim($options['searchTerm']));
            $processedTerms = [];
            foreach ($terms as $term) {
                if (!empty($term)) {
                    $processedTerms[] = preg_replace('/[()|&!:]/', '', $term);
                }
            }
            if (!empty($processedTerms)) {
                $lastTerm = array_pop($processedTerms);
                $processedTerms[] = $lastTerm . ':*'; 
                $tsQueryParam = implode(' & ', $processedTerms);
                $whereClauses[] = "p.search_vector @@ to_tsquery('simple', ?)";
                $params[] = $tsQueryParam;
            }
        }
        if (!empty($options['categoryId'])) {
            $whereClauses[] = "p.product_id IN (SELECT product_id FROM category_items WHERE category_id = ?)";
            $params[] = $options['categoryId'];
        }
        if (!empty($options['store_id'])) {
            $whereClauses[] = "p.store_id = ?";
            $params[] = $options['store_id'];
        }

        if (isset($options['minPrice']) && $options['minPrice'] !== '') {
            $whereClauses[] = "p.price >= ?";
            $params[] = (int)$options['minPrice'];
        }
        if (isset($options['maxPrice']) && $options['maxPrice'] !== '') {
            $whereClauses[] = "p.price <= ?";
            $params[] = (int)$options['maxPrice'];
        }
		if (!empty($options['stock']) && $options['stock'] === 'low') {
            $whereClauses[] = "(p.stock > 0 AND p.stock < 10)";
        }
		

        $whereSql = "WHERE " . implode(' AND ', $whereClauses);
        return [$whereSql, $params];
    }

    /**
     * [Private Helper] Counts the total number of products that match the filter conditions.
     *
     * @param string $whereSql The generated WHERE clause.
     * @param array $params The parameters to bind to the query.
     * @return int The total count of matching products.
     */
    private function countFilteredProducts($whereSql, $params) {
        $sql = "
            SELECT COUNT(*) as total
            FROM products p
            {$whereSql}
        ";
        $result = $this->db->selectOne($sql, $params);
        return $result ? (int)$result['total'] : 0;
    }

    /**
     * [Private Helper] Fetches the actual product records for the current page.
     *
     * @param string $whereSql The generated WHERE clause.
     * @param array $params The parameters to bind to the query.
     * @param int $limit The number of records to fetch (page size).
     * @param int $offset The starting record offset for the current page.
     * @return array A list of product records.
     */
	
	private function getFilteredProductsPage($whereSql, $params, $limit, $offset, $orderSql = '', $includeCategories = false) {
        // Condition for Limit Clause
        $limitClause = "";
        if ($limit > 0) {
            $limitClause = "LIMIT {$limit} OFFSET {$offset}";
        }

		if ($includeCategories) {
            // Legacy behavior for Seller Dashboard (needs category_names)
            // Note: This uses the heavier JOIN + GROUP BY approach
            $sql = "
                SELECT 
                    p.*, 
                    s.store_name,
                    COALESCE(string_agg(DISTINCT c.name, '|||'), '') AS category_names
                FROM (
                    SELECT p.product_id
                    FROM products p
                    {$whereSql}
                    " . ($orderSql ?: "") . "
                    {$limitClause}
                ) AS subset
                JOIN products p ON subset.product_id = p.product_id
                JOIN stores s ON p.store_id = s.store_id
                LEFT JOIN category_items ci ON p.product_id = ci.product_id
                LEFT JOIN categories c ON ci.category_id = c.category_id
                GROUP BY p.product_id, s.store_name
                " . ($orderSql ?: "") . "
            ";
        } else {
            // Optimized behavior for Public Listing (no categories needed)
            $sql = "
                SELECT 
                    p.product_id, 
                    p.product_name, 
                    p.price, 
                    p.stock, 
                    p.main_image_path, 
                    p.store_id,
                    s.store_name
                FROM (
                    SELECT p.product_id
                    FROM products p
                    {$whereSql}
                    " . ($orderSql ?: "") . "
                    {$limitClause}
                ) AS subset
                JOIN products p ON subset.product_id = p.product_id
                JOIN stores s ON p.store_id = s.store_id
                " . ($orderSql ?: "") . "
            ";
        }
		return $this->db->select($sql, $params);
	}
	

	/**
     * Retrieves only the main image path of a product.
     *
     * @param int $productId The product ID.
     * @return string|null The image path if found, otherwise null.
     */
    public function getImagePath(int $productId): ?string
    {
        $sql = "SELECT main_image_path FROM {$this->table} WHERE product_id = ? AND deleted_at IS NULL";
        $result = $this->db->selectOne($sql, [$productId]);
        return $result ? $result['main_image_path'] : null;
    }

	public function getLowStocks($storeId) {
        $sql = "SELECT COUNT(product_id) AS low_stocks FROM {$this->table} WHERE store_id = ? AND stock > 0 AND stock < 10 AND deleted_at IS NULL";
        $row = $this->db->selectOne($sql, [$storeId]);
        return isset($row['low_stocks']) ? (int)$row['low_stocks'] : 0;
    }

	public function getTotalProducts($storeId) {
        $sql = "SELECT COUNT(*) AS total_products FROM {$this->table} WHERE store_id = ? AND deleted_at IS NULL";
        $row = $this->db->selectOne($sql, [$storeId]);
        return isset($row['total_products']) ? (int)$row['total_products'] : 0;
    }

    
    /**
     * Finds a single product by its ID, joining with stores and categories to get full details.
     *
     * @param int $productId The ID of the product to find.
     * @return array|null An associative array of the product details, or null if not found.
     */
    public function findByIdWithDetails($productId) {
		$sql = "
			SELECT 
				p.*,
				s.store_name,
                s.store_description,
                s.store_logo_path,
				COALESCE(string_agg(c.name, ', ' ORDER BY c.name), '') AS categories
			FROM 
				products p
			JOIN 
				stores s ON p.store_id = s.store_id
			LEFT JOIN 
				category_items ci ON p.product_id = ci.product_id
			LEFT JOIN 
				categories c ON ci.category_id = c.category_id
			WHERE 
				p.product_id = ? AND p.deleted_at IS NULL
			GROUP BY
				p.product_id, s.store_name, s.store_logo_path, s.store_description
		";
        
        return $this->db->selectOne($sql, [$productId]);
    }

    /**
     * Mengambil rekomendasi produk dari kategori yang sama.
     *
     * @param int $categoryId ID Kategori
     * @param int $excludeId ID Produk saat ini (agar tidak tampil lagi)
     * @param int $limit Jumlah produk
     * @return array
     */
    public function getRecommendations(int $categoryId, int $excludeId, int $limit = 4): array {
        if ($categoryId <= 0) {
            return [];
        }

        $sql = "
            SELECT p.product_id, p.product_name, p.price, p.main_image_path
            FROM products p
            JOIN category_items ci ON p.product_id = ci.product_id
            WHERE ci.category_id = ?
            AND p.product_id != ?
            AND p.deleted_at IS NULL
            AND p.stock > 0
            ORDER BY RANDOM()
            LIMIT ?
        ";

        return $this->db->select($sql, [$categoryId, $excludeId, $limit]);
    }

    /**
     * Find all products belonging to a specific store.
     * 
     * @param int $storeId The ID of the store
     * @return array Array of products
     */
    public function findByStore($storeId) {
        $sql = "SELECT * FROM {$this->table} WHERE store_id = ? AND deleted_at IS NULL";
        return $this->db->select($sql, [$storeId]);
    }
}