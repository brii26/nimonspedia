<?php

class SellerController extends BaseController {
	private $productService;
	private $sellerService;

	public function __construct() {
		parent::__construct();
		$this->productService = new ProductService();
		$this->sellerService = new SellerService();
		$this->requireRole('SELLER');
	}

    public function createProductForm() {
        $this->render('pages/seller/products/create');
    }

	private function getSellerStoreId()
	{
		$storeId = $this->sellerService->getSellerStoreId();
		if (!$storeId) {
			$this->redirect('/dashboard?error=no_store');
			return null;
		}
		return $storeId;
	}

    public function listProducts() {
		if (isset($_GET['status']) && $_GET['status'] === 'product_created') {
			echo "<div class='alert alert-success'>Product created successfully!</div>";
		}
		$storeId = $this->getSellerStoreId();
        $options = [
            'page' => $this->getQuery('page', 1),
            'store_id' => $storeId 
        ];
        $productsData = $this->productService->getAllProducts($options);
        
        $this->render('pages/seller/products/index', ['productsData' => $productsData]);
    }

    public function storeProduct() {
        $postData = $this->getPost();

        try {
            $this->verifyCsrf();
            $this->validate($postData, [
                'product_name' => ['required', 'min:3'],
                'price' => ['required', 'numeric'],
                'stock' => ['required', 'numeric']
            ]);

			$storeId = $this->getSellerStoreId();
            $this->productService->createProduct($postData, $storeId);
            
            $this->redirect('/seller/products?status=product_created');

        } catch (ValidationException $e) {
            $this->render('pages/seller/products/create', [
                'errors' => $e->getErrors(),
                'old' => $postData
            ]);
        } catch (Exception $e) {
            $this->render('pages/seller/products/create', [
                'error' => $e->getMessage(),
                'old' => $postData
            ]);
        }
	}

	public function editProduct()
	{
		$productId = (int) $this->getQuery('id', 0);

		if ($productId <= 0) {
			$this->redirect('/seller/products?error=invalid_id');
			return;
		}

		$storeId = $this->getSellerStoreId();

		$product = $this->productService->getProductById($productId);
		if (!$product || (int) $product['store_id'] !== $storeId) {
			$this->redirect('/seller/products?error=not_found');
			return;
		}

		$this->render('pages/seller/products/edit', ['product' => $product]);
	}

	public function updateProduct() { 
		$postData = $this->getPost(); 
		$productId = (int)($this->getQuery('id', 0) ?: ($postData['product_id'] ?? 0)); 

		try { 
			$this->verifyCsrf(); 
			$this->validate($postData, [ 
				'product_name' => ['required', 'min:3'], 
				'price' => ['required', 'numeric'], 
				'stock' => ['required', 'numeric']
			]); 

			$storeId = $this->getSellerStoreId(); 
			$this->productService->updateProduct($productId, $postData, $storeId); 

			$this->redirect('/seller/products?status=product_updated');
		} catch (ValidationException $e) { 
			$this->render('pages/seller/products/edit', [ 
				'errors' => $e->getErrors(), 
				'old' => $postData, 
				'product' => array_merge(['product_id' => $productId], $postData) 
			]); 
		} catch (Exception $e) { 
			$this->render('pages/seller/products/edit', [
				'error' => $e->getMessage(), 
				'old' => $postData, 
				'product' => array_merge(['product_id' => $productId], $postData) 
			]); 
		} 
	} 

	public function deleteProduct() { 
		$postData = $this->getPost(); 
		$productId = (int)($this->getQuery('id', 0) ?: ($postData['product_id'] ?? 0));
		try { 
			$this->verifyCsrf(); 
			$storeId = $this->getSellerStoreId(); 
			$this->productService->deleteProduct($productId, $storeId); 
			$this->redirect('/seller/products?status=product_deleted'); 
		} catch (Exception $e) { 
			$this->redirect('/seller/products?error=' . urlencode($e->getMessage())); 
		} 
	} 

    public function updateStore() {
        $this->requireRole('SELLER');
        $post = $this->getPost();
        $isAjax = !empty($_SERVER['HTTP_XML_REQUEST']) && 
                  strtolower($_SERVER['HTTP_XML_REQUEST']) == 'xmlhttprequest';

        try {
            $this->verifyCsrf();
            $this->validate($post, [
                'store_name'        => ['required', 'min:3', 'max:255'],
                'store_description' => ['max:1000'],
            ]);

			$storeId = $this->getSellerStoreId();
			if (!$storeId) {
                throw new Exception('Store not found');
            }

			$row = $this->sellerService->updateStore($post, $storeId);

            if ($isAjax) {
                header('Content-Type: application/json');
                $response = [
                    'success' => true,
                    'data' => [
                        'store_name' => $post['store_name'],
                        'store_description' => $post['store_description'],
                        'store_logo_path' => $row['store_logo_path'] ?? null,
                        'last_updated' => $row['last_updated'] ?? null
                    ]
                ];
                echo json_encode($response);
                exit;
            } else {
                $this->redirect('/dashboard?status=store_updated'. ($row && isset($row['last_updated']) ? '&t='.$row['last_updated'] : ''));
            }
        } catch (ValidationException $e) {
            if ($isAjax) {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'message' => $e->getFirstError()
                ]);
                exit;
            } else {
                $this->redirect('/dashboard?error=' . urlencode($e->getFirstError()));
            }
        } catch (Exception $e) {
            if ($isAjax) {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'message' => $e->getMessage()
                ]);
                exit;
            } else {
                $this->redirect('/dashboard?error=' . urlencode($e->getMessage()));
            }
        }
    }
}