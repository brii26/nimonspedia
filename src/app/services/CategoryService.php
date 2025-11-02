<?php
class CategoryService {
    protected $categoryRepo;

    public function __construct() {
        $this->categoryRepo = new CategoryRepository();
    }

    public function getAllCategories(): array  {
        return $this->categoryRepo->getAllCategories();
    }

    public function getForProduct(int $productId): array {
        return $this->categoryRepo->getCategoriesForProduct($productId);
    }

    public function updateForProduct(int $productId, array $categoryIds): bool {
        return $this->categoryRepo->updateProductCategories($productId, $categoryIds);
    }
}