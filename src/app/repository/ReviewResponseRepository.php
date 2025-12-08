<?php

class ReviewResponseRepository extends BaseRepository 
{
    protected $table = 'review_responses';

    protected function getPrimaryKey() 
    {
        return 'response_id';
    }

    /**
     * Get response(s) for a review
     * 
     * @param int $reviewId
     * @param string|null $type Filter by type: 'seller' or 'admin'
     * @return array
     */
    public function getByReview($reviewId, $type = null)
    {
        $sql = "
            SELECT 
                rr.*,
                u.username,
                u.full_name
            FROM {$this->table} rr
            LEFT JOIN users u ON rr.user_id = u.user_id
            WHERE rr.review_id = ?
        ";
        
        $params = [$reviewId];
        
        if ($type !== null) {
            $sql .= " AND rr.response_type = ?";
            $params[] = $type;
        }
        
        $sql .= " ORDER BY rr.created_at ASC";
        
        return $this->db->select($sql, $params);
    }

    /**
     * Get a specific response by review and type
     * 
     * @param int $reviewId
     * @param string $type 'seller' or 'admin'
     * @return array|null
     */
    public function findByReviewAndType($reviewId, $type)
    {
        $sql = "
            SELECT 
                rr.*,
                u.username,
                u.full_name
            FROM {$this->table} rr
            LEFT JOIN users u ON rr.user_id = u.user_id
            WHERE rr.review_id = ? AND rr.response_type = ?
            LIMIT 1
        ";
        
        return $this->db->selectOne($sql, [$reviewId, $type]);
    }

    /**
     * Check if a response already exists for a review and type
     * 
     * @param int $reviewId
     * @param string $type
     * @return bool
     */
    public function exists($reviewId, $type)
    {
        $sql = "
            SELECT COUNT(*) as total 
            FROM {$this->table}
            WHERE review_id = ? AND response_type = ?
        ";
        
        $result = $this->db->selectOne($sql, [$reviewId, $type]);
        return $result && (int)$result['total'] > 0;
    }

    /**
     * Create a response (with duplicate check via UNIQUE constraint)
     * 
     * @param array $data
     * @return int|false Response ID or false on failure
     */
    public function createResponse($data)
    {
        // Check if already exists
        if ($this->exists($data['review_id'], $data['response_type'])) {
            return false;
        }

        return $this->create($data);
    }

    /**
     * Update a response
     * 
     * @param int $reviewId
     * @param string $type
     * @param string $responseText
     * @return bool
     */
    public function updateResponse($reviewId, $type, $responseText)
    {
        $sql = "
            UPDATE {$this->table}
            SET 
                response_text = ?,
                updated_at = NOW()
            WHERE review_id = ? AND response_type = ?
        ";
        
        return $this->db->update($sql, [$responseText, $reviewId, $type]) > 0;
    }

    /**
     * Delete a response
     * 
     * @param int $reviewId
     * @param string $type
     * @return bool
     */
    public function deleteResponse($reviewId, $type)
    {
        $sql = "
            DELETE FROM {$this->table}
            WHERE review_id = ? AND response_type = ?
        ";
        
        return $this->db->delete($sql, [$reviewId, $type]) > 0;
    }

    /**
     * Delete all responses for a review
     * Used when a review is deleted
     * 
     * @param int $reviewId
     * @return bool
     */
    public function deleteByReview($reviewId)
    {
        $sql = "DELETE FROM {$this->table} WHERE review_id = ?";
        return $this->db->delete($sql, [$reviewId]) >= 0;
    }

    /**
     * Get all responses by user (for admin/seller dashboard)
     * 
     * @param int $userId
     * @param string|null $type Filter by type
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public function getByUser($userId, $type = null, $page = 1, $perPage = 10)
    {
        $offset = ($page - 1) * $perPage;
        
        $whereClause = "rr.user_id = ?";
        $params = [$userId];
        
        if ($type !== null) {
            $whereClause .= " AND rr.response_type = ?";
            $params[] = $type;
        }
        
        $sql = "
            SELECT 
                rr.*,
                r.rating,
                r.comment as review_comment,
                p.product_name,
                p.product_image,
                reviewer.username as reviewer_username
            FROM {$this->table} rr
            LEFT JOIN reviews r ON rr.review_id = r.review_id
            LEFT JOIN products p ON r.product_id = p.product_id
            LEFT JOIN users reviewer ON r.user_id = reviewer.user_id
            WHERE {$whereClause}
            ORDER BY rr.created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $perPage;
        $params[] = $offset;
        
        $responses = $this->db->select($sql, $params);
        
        // Count total
        $countSql = "
            SELECT COUNT(*) as total
            FROM {$this->table}
            WHERE {$whereClause}
        ";
        $countParams = array_slice($params, 0, -2); // Remove LIMIT and OFFSET
        $countResult = $this->db->selectOne($countSql, $countParams);
        $total = $countResult ? (int)$countResult['total'] : 0;
        
        return [
            'data' => $responses,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => ceil($total / $perPage),
            'has_more' => ($page * $perPage) < $total
        ];
    }
}
