<?php

class ProductService {
    private $productRepository;
	private $categoryService;

    public function __construct() {
        $this->productRepository = new ProductRepository();
		$this->categoryService = new CategoryService();
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

    public function createProduct($data, $storeId) {
        if (empty($data['product_name']) || !isset($data['price']) || !isset($data['stock'])) {
            throw new Exception("Product name, price, and stock are required.");
        }
        if (!is_numeric($data['price']) || $data['price'] < 0) {
            throw new Exception("Price must be a non-negative number.");
        }
    
        $productImageArray = $data['product_image'] ?? null;
        unset($data['description_plain_text']);

        $product_image_path = null;
        if (is_array($productImageArray) && ($productImageArray['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
            $product_image_path = FileService::saveUploadedImage($productImageArray, 'product_image');
        }
    
        $now = date('Y-m-d H:i:s');
        $productData = [
            'product_name' => htmlspecialchars($data['product_name']),
            'description' => $data['product-description'] ?? '',
            'price' => (float)$data['price'],
            'stock' => (int)$data['stock'],
            'store_id' => $storeId,
            'main_image_path' => $product_image_path,
            'created_at' => $now,
            'updated_at' => $now
        ];
    
        $productId = $this->productRepository->create($productData);
        if (!$productId) {
            throw new Exception('Failed to create product (DB insert returned no id).');
        }
    
        return (int)$productId;
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
    
        $uploadedFileArray = $data['product_image'] ?? null;
        unset($data['description_plain_text']);
        
        $oldProductImage = $this->productRepository->getImagePath($productId);
        $productImagePath = $oldProductImage; 
        
        if (is_array($uploadedFileArray)) {
            $productImagePath = FileService::saveUploadedImage($uploadedFileArray, 'product_image', $oldProductImage
            );
        }

        $updateData = [
            'product_name' => htmlspecialchars($data['product_name']),
            'description' => $data['product-description'] ?? '',
            'price' => (float)$data['price'],
            'stock' => (int)$data['stock'],
            'main_image_path' => $productImagePath
        ];
    
        if (!$this->productRepository->update($productId, $updateData)) {
            throw new Exception("Failed to update product.");
        }
    
        $categoryId = $data['category_id'] ?? null;
        $categoryIds = !empty($categoryId) ? [(int)$categoryId] : [];
        $this->categoryService->updateForProduct($productId, $categoryIds);
    
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