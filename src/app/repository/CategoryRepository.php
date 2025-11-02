<?php

class CategoryRepository extends BaseRepository
{
    protected $table = 'categories';

    /**
     * Override primary key for categories table
     */
    protected function getPrimaryKey()
    {
        return 'category_id';
    }

    /**
     * Get all categories for dropdown (used in create.php / edit.php)
     * @return array [['category_id'=>int,'name'=>string], ...]
     */
    public function getAllCategories()
    {
        $sql = "SELECT category_id, name FROM {$this->table} ORDER BY name ASC";
        return $this->db->select($sql, []);
    }

    /**
     * Get categories linked to a product (for edit pre-selection)
     * @param int $productId
     * @return array [['category_id'=>int,'name'=>string], ...]
     */
    public function getCategoriesForProduct(int $productId)
    {
        $sql = "
            SELECT c.category_id, c.name
            FROM categories c
            JOIN category_items ci ON c.category_id = ci.category_id
            WHERE ci.product_id = ?
            ORDER BY c.name
        ";
        return $this->db->select($sql, [$productId]);
    }

    /**
     * Sync product-category mapping (delete old, insert new)
     * @param int $productId
     * @param array $categoryIds
     * @return bool
     */
    public function updateProductCategories(int $productId, array $categoryIds)
    {
        // Delete old mappings
        $this->db->delete("DELETE FROM category_items WHERE product_id = ?", [$productId]);

        // Insert new mappings if exist
        if (!empty($categoryIds)) {
            foreach ($categoryIds as $cid) {
                $cid = (int)$cid;
                if ($cid > 0) {
                    $sql = "INSERT INTO category_items (category_id, product_id) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM category_items WHERE category_id = ? AND product_id = ?)";
                    $this->db->query($sql, [$cid, $productId, $cid, $productId]);
                }
            }
        }

        return true;
    }
}
