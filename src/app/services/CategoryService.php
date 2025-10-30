<?php
class CategoryService {
    protected $categoryRepo;

    public function __construct() {
        $this->categoryRepo = new CategoryRepository();
    }

    // Simple bridge to repository for dropdown usage
    public function getForDropdown(): array {
        return $this->categoryRepo->getDropdownOptions();
    }

    // For pre-select in edit form
    public function getForProduct(int $productId): array {
        return $this->categoryRepo->getCategoriesForProduct($productId);
    }

    // Sync after create/update
    public function updateForProduct(int $productId, array $categoryIds): bool {
        return $this->categoryRepo->updateProductCategories($productId, $categoryIds);
    }
}