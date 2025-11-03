<?php

class ProductService {
    private $productRepository;
	private $categoryService;

    public function __construct() {
        $this->productRepository = new ProductRepository();
		$this->categoryService = new CategoryService();
    }

    public function getAllProducts($options) {
        return $this->productRepository->searchAndFilter($options);
    }
    
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

		$categoryIds = $data['category_ids'] ?? [];
    	$firstCategoryId = (int)($categoryIds[0] ?? 0);
    
        $now = date('Y-m-d H:i:s');
        $productData = [
            'product_name' => htmlspecialchars($data['product_name']),
            'description' => SanitizerService::sanitizeRichText($data['product-description']) ?? '',
            'price' => (float)$data['price'],
            'stock' => (int)$data['stock'],
            'store_id' => $storeId,
            'main_image_path' => $product_image_path,
            'manual_keywords' => $this->generateManualKeywords(
                $data['product_name'], 
                $firstCategoryId
            ),
            'created_at' => $now,
            'updated_at' => $now
        ];
    
        $productId = $this->productRepository->create($productData);
        if (!$productId) {
            throw new Exception('Failed to create product (DB insert returned no id).');
        }

		if (!empty($categoryIds)) {
			$this->categoryService->updateForProduct($productId, array_map('intval', $categoryIds));
		}
		
        return (int)$productId;
    }
	

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

		$categoryIds = $data['category_ids'] ?? [];
		$categoryIds = array_map('intval', $categoryIds);
		$firstCategoryId = (int)($categoryIds[0] ?? 0);

        $updateData = [
            'product_name' => htmlspecialchars($data['product_name']),
            'description' => SanitizerService::sanitizeRichText($data['product-description']) ?? '',
            'price' => (float)$data['price'],
            'stock' => (int)$data['stock'],
            'manual_keywords' => $this->generateManualKeywords(
                $data['product_name'], 
                $firstCategoryId
            ),
            'main_image_path' => $productImagePath
        ];
    
        if (!$this->productRepository->update($productId, $updateData)) {
            throw new Exception("Failed to update product.");
        }
    
		$this->categoryService->updateForProduct($productId, $categoryIds);
    
        return true;
    }
	
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

    private function generateManualKeywords(string $productName, int $categoryId): string
    {
        $keywords = [];
        $nameLower = strtolower($productName);

        switch ($categoryId) {
            case 1: // Electronics
                $keywords = array_merge($keywords, ['elektronik', 'gadget', 'laptop', 'notebook', 'komputer', 'pc', 'handphone', 'hp', 'smartphone', 'ponsel', 'aksesoris']);
                break;
            case 2: // Fashion
                $keywords = array_merge($keywords, ['fashion', 'baju', 'pakaian', 'kaos', 'kemeja', 'celana', 'sepatu', 'jaket', 'tas', 'busana']);
                break;
            case 3: // Food & Beverages
                $keywords = array_merge($keywords, ['makanan', 'minuman', 'snack', 'cemilan', 'kopi', 'teh', 'sembako', 'bumbu', 'dapur']);
                break;
            case 4: // Books
                $keywords = array_merge($keywords, ['buku', 'novel', 'komik', 'majalah', 'pelajaran', 'edukasi', 'literatur', 'bacaan']);
                break;
            case 5: // Sports & Outdoor
                $keywords = array_merge($keywords, ['olahraga', 'sport', 'outdoor', 'gym', 'fitness', 'sepatu olahraga', 'bola', 'alat pancing', 'mendaki', 'gunung']);
                break;
            case 6: // Health & Beauty
                $keywords = array_merge($keywords, ['kesehatan', 'kecantikan', 'skincare', 'makeup', 'kosmetik', 'obat', 'vitamin', 'suplemen', 'parfum', 'wajah']);
                break;
            case 7: // Home & Garden
                $keywords = array_merge($keywords, ['rumah', 'taman', 'kebun', 'dapur', 'perabotan', 'furnitur', 'dekorasi', 'alat masak', 'lampu', 'perkakas']);
                break;
            case 8: // Toys & Games
                $keywords = array_merge($keywords, ['mainan', 'main', 'game', 'hobi', 'anak', 'boneka', 'action figure', 'video game', 'puzzle', 'kartu']);
                break;
            case 9: // Automotive
                $keywords = array_merge($keywords, ['otomotif', 'mobil', 'motor', 'aksesoris mobil', 'aksesoris motor', 'oli', 'helm', 'suku cadang', 'mesin']);
                break;
        }

        // Kamus berdasarkan Brand (dari nama produk)
        if (str_contains($nameLower, 'macbook') || str_contains($nameLower, 'iphone') || str_contains($nameLower, 'ipad')) {
            $keywords[] = 'apple';
        }
        if (str_contains($nameLower, 'galaxy')) {
            $keywords[] = 'samsung';
        }
        if (str_contains($nameLower, 'thinkpad') || str_contains($nameLower, 'legion') || str_contains($nameLower, 'yoga')) {
            $keywords[] = 'lenovo';
        }
        if (str_contains($nameLower, 'rog') || str_contains($nameLower, 'tuf') || str_contains($nameLower, 'zenbook')) {
            $keywords[] = 'asus';
        }
        if (str_contains($nameLower, 'playstation') || str_contains($nameLower, 'bravia') || str_contains($nameLower, 'alpha')) {
            $keywords[] = 'sony';
        }
        if (str_contains($nameLower, 'switch')) {
            $keywords[] = 'nintendo';
        }

        return implode(' ', array_unique(array_filter($keywords)));
    }
}