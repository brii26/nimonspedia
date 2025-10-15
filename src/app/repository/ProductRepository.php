<?php

require_once 'app/repositories/BaseRepository.php';

class ProductRepository extends BaseRepository {
    protected $table = 'products';
    
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
        $page = (int)($options['page'] ?? 1);
        $perPage = (int)($options['perPage'] ?? 12);
        $offset = ($page - 1) * $perPage;

        list($whereSql, $params) = $this->buildFilterConditions($options);

        $total = $this->countFilteredProducts($whereSql, $params);

        $records = $this->getFilteredProductsPage($whereSql, $params, $perPage, $offset);

        return [
            'data' => $records,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => $total > 0 ? ceil($total / $perPage) : 0
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

        // Filter based on search term
        if (!empty($options['searchTerm'])) {
            $whereClauses[] = "p.product_name ILIKE ?";
            $params[] = "%{$options['searchTerm']}%";
        }
        // Filter based on category id
        if (!empty($options['categoryId'])) {
            $whereClauses[] = "p.product_id IN (SELECT product_id FROM category_items WHERE category_id = ?)";
            $params[] = $options['categoryId'];
        }
        // Filter minimum price
        if (isset($options['minPrice']) && $options['minPrice'] !== '') {
            $whereClauses[] = "p.price >= ?";
            $params[] = $options['minPrice'];
        }
        // Filter maximum price
        if (isset($options['maxPrice']) && $options['maxPrice'] !== '') {
            $whereClauses[] = "p.price <= ?";
            $params[] = $options['maxPrice'];
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
            SELECT COUNT(DISTINCT p.product_id) as total 
            FROM products p
            LEFT JOIN category_items ci ON p.product_id = ci.product_id
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
    private function getFilteredProductsPage($whereSql, $params, $limit, $offset) {
        $sql = "
            SELECT p.*, s.store_name
            FROM products p
            JOIN stores s ON p.store_id = s.store_id
            LEFT JOIN category_items ci ON p.product_id = ci.product_id
            {$whereSql}
            GROUP BY p.product_id, s.store_name
            ORDER BY p.created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ";
        
        return $this->db->select($sql, $params);
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
                GROUP_CONCAT(c.name SEPARATOR ', ') as categories
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
                p.product_id, s.store_name
        ";
        
        return $this->db->selectOne($sql, [$productId]);
    }
}