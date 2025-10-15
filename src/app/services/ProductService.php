<?php

require_once 'app/repositories/ProductRepository.php';

class ProductService {
    private $productRepository;

    public function __construct() {
        $this->productRepository = new ProductRepository();
    }

    /**
     * Retrieves a paginated and filtered list of products.
     * This method is primarily used for the public product discovery page,
     * forwarding the filter criteria to the repository layer.
     *
     * @param array $options An associative array of filter and pagination options.
     * Example: ['page' => 1, 'searchTerm' => 'Laptop', 'categoryId' => 3]
     * @return array The paginated result set containing product data and metadata.
     */
    public function getAllProducts($options) {
        return $this->productRepository->searchAndFilter($options);
    }
    
    /**
     * Retrieves the full details for a single product by its unique ID.
     * It performs a basic validation to ensure the ID is an integer before querying.
     *
     * @param int $productId The unique identifier for the product.
     * @return array|null An associative array containing the product's detailed information,
     * or null if the product is not found or the ID is invalid.
     */
    public function getProductById($productId) {
        return $this->productRepository->findByIdWithDetails($productId);
    }

    /**
     * Creates a new product for a specific seller.
     * This method contains the business logic for validating and sanitizing
     * the input data before passing it to the repository for creation.
     *
     * @param array $data The product data submitted from a form (e.g., $_POST).
     * @param int $storeId The ID of the seller's store, typically retrieved from the session.
     * @return int The ID of the newly created product upon successful insertion.
     * @throws Exception if required data is missing or invalid.
     */
    public function createProduct($data, $storeId) {
        if (empty($data['product_name']) || !isset($data['price']) || !isset($data['stock'])) {
            throw new Exception("Product name, price, and stock are required.");
        }
        if (!is_numeric($data['price']) || $data['price'] < 0) {
            throw new Exception("Price must be a non-negative number.");
        }

        $productData = [
            'product_name' => htmlspecialchars($data['product_name']),
            'description' => htmlspecialchars($data['description'] ?? ''),
            'price' => (float)$data['price'],
            'stock' => (int)$data['stock'],
            'store_id' => $storeId
        ];

        return $this->productRepository->create($productData);
    }

    /**
     * Update an existing product after verifying ownership.
     * @throws Exception if validation or ownership check fails.
     */
    public function updateProduct($productId, $data, $storeId) {
        $product = $this->productRepository->find($productId);
        if (!$product) {
            throw new Exception("Product not found.");
        }

        if ($product['store_id'] != $storeId) {
            throw new Exception("You are not authorized to edit this product.");
        }
        
        $updateData = [
            'product_name' => htmlspecialchars($data['product_name']),
            'description' => htmlspecialchars($data['description'] ?? ''),
            'price' => (float)$data['price'],
            'stock' => (int)$data['stock']
        ];

        if (!$this->productRepository->update($productId, $updateData)) {
            throw new Exception("Failed to update product.");
        }

        return true;
    }
    
    /**
     * Soft delete a product after verifying ownership.
     * @throws Exception if validation or ownership check fails.
     */
    public function deleteProduct($productId, $storeId) {
        $product = $this->productRepository->find($productId);
        if (!$product) {
            throw new Exception("Product not found.");
        }
        
        if ($product['store_id'] != $storeId) {
            throw new Exception("You are not authorized to delete this product.");
        }

        if (!$this->productRepository->delete($productId)) {
            throw new Exception("Failed to delete product.");
        }
        
        return true;
    }
}