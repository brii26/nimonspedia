<?php

class SellerController extends BaseController {
    private $productService;
	private $storeRepo;

    public function __construct() {
        parent::__construct();
        $this->productService = new ProductService();
		$this->storeRepo = new StoreRepository();
        $this->requireRole('SELLER');
    }

    public function createProductForm() {
        $this->render('pages/seller/products/create');
    }

	private function getSellerStoreId()
	{
		$user = Auth::user();
		if (!$user || $user['role'] !== 'SELLER') {
			$this->redirect('/login');
		}

		$row = $this->storeRepo->findByUserId($user['user_id']);

		if (!$row) {
			$this->redirect('/dashboard?error=no_store');
		}
		return (int) $row['store_id'];
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

	// OTW
	// public function orders() { 
	// 	$this->requireRole('SELLER');
	// 	$user = Auth::user(); 
	// 	$row = $this->db->selectOne("SELECT store_id FROM stores WHERE user_id = ? LIMIT 1", [$user['user_id']]);
	// 	if (!$row) { 
	// 		$this->redirect('/dashboard?error=no_store'); 
	// 		return; 
	// 	} 
	// 	$storeId = (int)$row['store_id']; 

	// 	$orders = $this->db->select(  
	// 		"SELECT order_id, total_price, status, created_at FROM orders WHERE store_id = ? ORDER BY created_at DESC",
	// 		[$storeId]
	// 	); 

	// 	$this->render('pages/seller/orders/index', [ 
	// 		'orders' => $orders,
	// 		'user' => $user
	// 	]); 
	// } 
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
        try {
            $this->verifyCsrf();
            $this->validate($post, [
                'store_name'        => ['required', 'min:3', 'max:255'],
                'store_description' => ['max:1000'],
            ]);

            $storeId = $this->getSellerStoreId();
            $name = $post['store_name'];
            $desc = $post['store_description'] ?? '';
            $row = $this->storeRepo->updateStore($storeId, $name, $desc);

            $this->redirect('/dashboard?status=store_updated'
                . ($row && isset($row['last_updated']) ? '&t='.$row['last_updated'] : ''));
        } catch (ValidationException $e) {
            $this->redirect('/dashboard?error=' . urlencode($e->getFirstError()));
        } catch (Exception $e) {
            $this->redirect('/dashboard?error=' . urlencode($e->getMessage()));
        }
    }
}