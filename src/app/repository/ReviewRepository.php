<?php

class ReviewRepository extends BaseRepository 
{
    protected $table = 'reviews';

    protected function getPrimaryKey() 
    {
        return 'review_id';
    }

    /**
     * Get reviews by product ID with pagination
     * Only returns non-deleted and non-hidden reviews
     * 
     * @param int $productId
     * @param int $page
     * @param int $perPage
     * @return array Paginated results with review data including user info
     */
    public function getByProduct($productId, $page = 1, $perPage = 10)
    {
        $offset = ($page - 1) * $perPage;
        
        $sql = "
            SELECT 
                r.*,
                u.name as username,
                COUNT(ri.image_id) as image_count
            FROM {$this->table} r
            LEFT JOIN users u ON r.user_id = u.user_id
            LEFT JOIN review_images ri ON r.review_id = ri.review_id
            WHERE r.product_id = ? 
                AND r.deleted_at IS NULL 
                AND r.is_hidden = FALSE
            GROUP BY r.review_id, u.user_id
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $reviews = $this->db->select($sql, [$productId, $perPage, $offset]);
        
        // Get total count
        $countSql = "
            SELECT COUNT(*) as total 
            FROM {$this->table} 
            WHERE product_id = ? 
                AND deleted_at IS NULL 
                AND is_hidden = FALSE
        ";
        $countResult = $this->db->selectOne($countSql, [$productId]);
        $total = $countResult ? (int)$countResult['total'] : 0;
        
        return [
            'data' => $reviews,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => ceil($total / $perPage),
            'has_more' => ($page * $perPage) < $total
        ];
    }

    /**
     * Get average rating and review count for a product
     * Only counts non-deleted and non-hidden reviews
     * 
     * @param int $productId
     * @return array ['average_rating' => float, 'review_count' => int]
     */
    public function getProductRatingStats($productId)
    {
        $sql = "
            SELECT 
                COALESCE(AVG(rating), 0) as average_rating,
                COUNT(*) as review_count
            FROM {$this->table}
            WHERE product_id = ? 
                AND deleted_at IS NULL 
                AND is_hidden = FALSE
        ";
        
        $result = $this->db->selectOne($sql, [$productId]);
        
        return [
            'average_rating' => $result ? round((float)$result['average_rating'], 1) : 0,
            'review_count' => $result ? (int)$result['review_count'] : 0
        ];
    }

    /**
     * Get rating distribution for a product (1-5 stars count)
     * 
     * @param int $productId
     * @return array [1 => count, 2 => count, 3 => count, 4 => count, 5 => count]
     */
    public function getRatingDistribution($productId)
    {
        $sql = "
            SELECT 
                rating,
                COUNT(*) as count
            FROM {$this->table}
            WHERE product_id = ? 
                AND deleted_at IS NULL 
                AND is_hidden = FALSE
            GROUP BY rating
            ORDER BY rating DESC
        ";
        
        $results = $this->db->select($sql, [$productId]);
        
        // Initialize with 0 for all ratings
        $distribution = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
        
        foreach ($results as $row) {
            $distribution[(int)$row['rating']] = (int)$row['count'];
        }
        
        return $distribution;
    }

    /**
     * Check if user has already reviewed a specific product in an order
     * 
     * @param int $orderId
     * @param int $productId
     * @return bool|array False if no review, or review data if exists
     */
    public function findByOrderAndProduct($orderId, $productId)
    {
        $sql = "
            SELECT * 
            FROM {$this->table}
            WHERE order_id = ? 
                AND product_id = ?
            LIMIT 1
        ";
        
        return $this->db->selectOne($sql, [$orderId, $productId]);
    }

    /**
     * Get review by ID with user info and images
     * 
     * @param int $reviewId
     * @param bool $includeHidden Include hidden reviews
     * @return array|null
     */
    public function findWithDetails($reviewId, $includeHidden = false)
    {
        $hiddenCondition = $includeHidden ? '' : 'AND r.is_hidden = FALSE';
        
        $sql = "
            SELECT 
                r.*,
                u.name as username,
                p.product_name,
                p.product_image
            FROM {$this->table} r
            LEFT JOIN users u ON r.user_id = u.user_id
            LEFT JOIN products p ON r.product_id = p.product_id
            WHERE r.review_id = ? 
                AND r.deleted_at IS NULL
                {$hiddenCondition}
            LIMIT 1
        ";
        
        return $this->db->selectOne($sql, [$reviewId]);
    }

    /**
     * Get reviews by user ID
     * 
     * @param int $userId
     * @param int $page
     * @param int $perPage
     * @return array Paginated results
     */
    public function getByUser($userId, $page = 1, $perPage = 10)
    {
        $offset = ($page - 1) * $perPage;
        
        $sql = "
            SELECT 
                r.*,
                p.product_name,
                p.product_image,
                s.store_name
            FROM {$this->table} r
            LEFT JOIN products p ON r.product_id = p.product_id
            LEFT JOIN orders o ON r.order_id = o.order_id
            LEFT JOIN stores s ON o.store_id = s.store_id
            WHERE r.user_id = ? 
                AND r.deleted_at IS NULL
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $reviews = $this->db->select($sql, [$userId, $perPage, $offset]);
        
        $total = $this->count('user_id = ? AND deleted_at IS NULL', [$userId]);
        
        return [
            'data' => $reviews,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => ceil($total / $perPage),
            'has_more' => ($page * $perPage) < $total
        ];
    }

    /**
     * Get all reviews for admin moderation (includes hidden)
     * 
     * @param array $filters ['product_id', 'user_id', 'is_hidden', 'search']
     * @param int $page
     * @param int $perPage
     * @return array Paginated results
     */
    public function getAllForModeration($filters = [], $page = 1, $perPage = 20)
    {
        $offset = ($page - 1) * $perPage;
        $where = ['r.deleted_at IS NULL'];
        $params = [];
        
        if (!empty($filters['product_id'])) {
            $where[] = 'r.product_id = ?';
            $params[] = $filters['product_id'];
        }
        
        if (!empty($filters['user_id'])) {
            $where[] = 'r.user_id = ?';
            $params[] = $filters['user_id'];
        }
        
        if (isset($filters['is_hidden'])) {
            $where[] = 'r.is_hidden = ?';
            $params[] = $filters['is_hidden'] ? 'TRUE' : 'FALSE';
        }
        
        if (!empty($filters['search'])) {
            $where[] = '(p.product_name ILIKE ? OR u.name ILIKE ? OR r.comment ILIKE ?)';
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = implode(' AND ', $where);
        
        $sql = "
            SELECT 
                r.*,
                u.name as username,
                p.product_name,
                p.product_image,
                hider.name as hidden_by_username
            FROM {$this->table} r
            LEFT JOIN users u ON r.user_id = u.user_id
            LEFT JOIN products p ON r.product_id = p.product_id
            LEFT JOIN users hider ON r.hidden_by = hider.user_id
            WHERE {$whereClause}
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $perPage;
        $params[] = $offset;
        
        $reviews = $this->db->select($sql, $params);
        
        $countSql = "
            SELECT COUNT(*) as total
            FROM {$this->table} r
            LEFT JOIN users u ON r.user_id = u.user_id
            LEFT JOIN products p ON r.product_id = p.product_id
            WHERE {$whereClause}
        ";
        
        // Remove LIMIT and OFFSET params for count
        $countParams = array_slice($params, 0, -2);
        $countResult = $this->db->selectOne($countSql, $countParams);
        $total = $countResult ? (int)$countResult['total'] : 0;
        
        return [
            'data' => $reviews,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => ceil($total / $perPage),
            'has_more' => ($page * $perPage) < $total
        ];
    }

    /**
     * Hide/unhide a review (admin action)
     * 
     * @param int $reviewId
     * @param bool $isHidden
     * @param int $adminUserId
     * @param string|null $reason
     * @return bool
     */
    public function setHiddenStatus($reviewId, $isHidden, $adminUserId, $reason = null)
    {
        $sql = "
            UPDATE {$this->table}
            SET 
                is_hidden = ?,
                hidden_by = ?,
                hidden_reason = ?,
                hidden_at = ?
            WHERE review_id = ?
        ";
        
        $hiddenAt = $isHidden ? date('Y-m-d H:i:s') : null;
        $hiddenBy = $isHidden ? $adminUserId : null;
        
        $params = [
            $isHidden ? 'TRUE' : 'FALSE',
            $hiddenBy,
            $reason,
            $hiddenAt,
            $reviewId
        ];
        
        return $this->db->update($sql, $params) > 0;
    }

    /**
     * Soft delete a review
     * 
     * @param int $reviewId
     * @return bool
     */
    public function softDelete($reviewId)
    {
        $sql = "
            UPDATE {$this->table}
            SET deleted_at = NOW()
            WHERE review_id = ?
        ";
        
        return $this->db->update($sql, [$reviewId]) > 0;
    }

    /**
     * Get reviews for a specific order
     * 
     * @param int $orderId
     * @return array
     */
    public function getByOrder($orderId)
    {
        $sql = "
            SELECT 
                r.*,
                p.product_name,
                p.product_image
            FROM {$this->table} r
            LEFT JOIN products p ON r.product_id = p.product_id
            WHERE r.order_id = ? 
                AND r.deleted_at IS NULL
            ORDER BY r.created_at DESC
        ";
        
        return $this->db->select($sql, [$orderId]);
    }

    /**
     * Get reviews for products by store with pagination and filters
     * 
     * @param array $productIds Array of product IDs
     * @param int $page
     * @param int $perPage
     * @param string|null $filter 'all', 'unanswered', 'answered'
     * @return array Paginated results
     */
    public function getByProductIds($productIds, $page = 1, $perPage = 10, $filter = 'all')
    {
        if (empty($productIds)) {
            return [
                'data' => [],
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => 0,
                'total_pages' => 0,
                'has_more' => false
            ];
        }

        $offset = ($page - 1) * $perPage;
        
        $sql = "
            SELECT 
                r.*,
                u.name as username,
                u.full_name,
                p.product_name,
                p.product_image,
                p.store_id,
                (
                    SELECT COUNT(*) 
                    FROM review_responses rr 
                    WHERE rr.review_id = r.review_id 
                    AND rr.responder_role = 'SELLER'
                    AND rr.deleted_at IS NULL
                ) as has_seller_response
            FROM {$this->table} r
            LEFT JOIN users u ON r.user_id = u.user_id
            LEFT JOIN products p ON r.product_id = p.product_id
            WHERE r.product_id = ANY(?)
                AND r.deleted_at IS NULL
        ";
        
        // Apply filter
        if ($filter === 'unanswered') {
            $sql .= " AND NOT EXISTS (
                SELECT 1 FROM review_responses rr 
                WHERE rr.review_id = r.review_id 
                AND rr.responder_role = 'SELLER'
                AND rr.deleted_at IS NULL
            )";
        } elseif ($filter === 'answered') {
            $sql .= " AND EXISTS (
                SELECT 1 FROM review_responses rr 
                WHERE rr.review_id = r.review_id 
                AND rr.responder_role = 'SELLER'
                AND rr.deleted_at IS NULL
            )";
        }
        
        $sql .= " ORDER BY r.created_at DESC LIMIT ? OFFSET ?";
        
        $reviews = $this->db->select($sql, ['{' . implode(',', $productIds) . '}', $perPage, $offset]);
        
        // Get total count
        $countSql = "
            SELECT COUNT(*) as total
            FROM {$this->table} r
            WHERE r.product_id = ANY(?)
                AND r.deleted_at IS NULL
        ";
        
        if ($filter === 'unanswered') {
            $countSql .= " AND NOT EXISTS (
                SELECT 1 FROM review_responses rr 
                WHERE rr.review_id = r.review_id 
                AND rr.responder_role = 'SELLER'
                AND rr.deleted_at IS NULL
            )";
        } elseif ($filter === 'answered') {
            $countSql .= " AND EXISTS (
                SELECT 1 FROM review_responses rr 
                WHERE rr.review_id = r.review_id 
                AND rr.responder_role = 'SELLER'
                AND rr.deleted_at IS NULL
            )";
        }
        
        $countResult = $this->db->selectOne($countSql, ['{' . implode(',', $productIds) . '}']);
        $total = $countResult['total'] ?? 0;
        
        $totalPages = ceil($total / $perPage);
        
        return [
            'data' => $reviews,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => $totalPages,
            'has_more' => $page < $totalPages
        ];
    }
}
