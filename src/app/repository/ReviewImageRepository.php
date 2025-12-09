<?php

class ReviewImageRepository extends BaseRepository 
{
    protected $table = 'review_images';

    protected function getPrimaryKey() 
    {
        return 'image_id';
    }

    /**
     * Get all images for a review
     * 
     * @param int $reviewId
     * @return array
     */
    public function getByReview($reviewId)
    {
        $sql = "
            SELECT * 
            FROM {$this->table}
            WHERE review_id = ?
            ORDER BY created_at ASC
        ";
        
        return $this->db->select($sql, [$reviewId]);
    }

    /**
     * Create multiple images for a review
     * 
     * @param int $reviewId
     * @param array $imagePaths Array of image URLs/paths
     * @return bool
     */
    public function createMultiple($reviewId, array $imagePaths)
    {
        if (empty($imagePaths)) {
            return true;
        }

        $values = [];
        $placeholders = [];
        
        foreach ($imagePaths as $path) {
            $placeholders[] = '(?, ?)';
            $values[] = $reviewId;
            $values[] = $path;
        }
        
        $sql = "
            INSERT INTO {$this->table} (review_id, image_url)
            VALUES " . implode(', ', $placeholders);
        
        return $this->db->insert($sql, $values) > 0;
    }

    /**
     * Delete all images for a review
     * 
     * @param int $reviewId
     * @return bool
     */
    public function deleteByReview($reviewId)
    {
        $sql = "DELETE FROM {$this->table} WHERE review_id = ?";
        return $this->db->delete($sql, [$reviewId]) >= 0; // >= 0 because 0 is ok if no images
    }

    /**
     * Delete specific image
     * 
     * @param int $imageId
     * @return bool
     */
    public function deleteImage($imageId)
    {
        $sql = "DELETE FROM {$this->table} WHERE image_id = ?";
        return $this->db->delete($sql, [$imageId]) > 0;
    }

    /**
     * Count images for a review
     * 
     * @param int $reviewId
     * @return int
     */
    public function countByReview($reviewId)
    {
        $sql = "SELECT COUNT(*) as total FROM {$this->table} WHERE review_id = ?";
        $result = $this->db->selectOne($sql, [$reviewId]);
        return $result ? (int)$result['total'] : 0;
    }

    /**
     * Get image by ID with review info
     * 
     * @param int $imageId
     * @return array|null
     */
    public function findWithReview($imageId)
    {
        $sql = "
            SELECT 
                ri.*,
                r.user_id,
                r.product_id
            FROM {$this->table} ri
            LEFT JOIN reviews r ON ri.review_id = r.review_id
            WHERE ri.image_id = ?
            LIMIT 1
        ";
        
        return $this->db->selectOne($sql, [$imageId]);
    }
}
