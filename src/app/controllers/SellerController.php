<?php


class SellerController extends BaseController {
    private $productService;
    private $storeService;
	private $categoryService;


    public function __construct() {
        parent::__construct();
        $this->productService = new ProductService();
        $this->storeService = new StoreService();
		$this->categoryService = new CategoryService();

        $this->requireRole('SELLER');
    }

    public function createProductForm() {
		$categories = $this->categoryService->getForDropdown();
		$this->render('pages/seller/products/create', [
			'categories' => $categories,
			'old' => $_SESSION['old'] ?? [],
			'errors' => $_SESSION['errors'] ?? [],
            'pageTitle' => 'Create Product',
            'cssFiles' => [
				'/css/pages/dashboard.css', 
				'https://cdn.quilljs.com/1.3.6/quill.snow.css',
				'/css/pages/seller/products/create.css'
			],
            'jsFiles' => [
                'https://cdn.quilljs.com/1.3.6/quill.js',
                '/js/utils/quill-setup.js', 
				'/js/pages/seller/products/create.js'
            ],
		]);
        
    }

    private function getSellerStoreId()
    {
        $storeId = $this->storeService->getSellerStoreId();
        if (!$storeId) {
            $this->redirect('/?error=no_store');
            return null;
        }
        return $storeId;
    }

    public function listProducts() {
		$storeId = $this->getSellerStoreId();
        $options = [
            'page' => $this->getQuery('page', 1),
            'store_id' => $storeId 
        ];
        $productsData = $this->productService->getAllProducts($options);

        $this->render('pages/seller/products/index', [
			'productsData' => $productsData,
			'cssFiles' => [
				'/css/pages/dashboard.css',
				'/css/pages/seller/products/index.css'
			],
            'jsFiles' => [
				'/js/pages/seller/products/index.js'
            ],
		]);
	}

    public function storeProduct() {
        $postData = $this->getPost();

		if (isset($postData['product-description'])) {
            $plainText = trim(strip_tags($postData['product-description']));
            $postData['description_plain_text'] = $plainText;
        }

		$categories = $this->categoryService->getForDropdown();

        try {
            $this->verifyCsrf();
			$postData['product_image'] = $_FILES['product_image'];

			$this->validate($postData, [ 
				'product_name' => ['required', 'min:0', 'max:200'], 
				'price' => ['required', 'numeric', 'numeric_min:1000'], 
				'stock' => ['required', 'numeric', 'numeric_min:0'],
				'description_plain_text' => ['max:1000'],
				'product_image' => [ 'size:2097152', 'mimes:jpeg,png,jpg,gif,webp']
			]); 

			$storeId = $this->getSellerStoreId();

			$productId = $this->productService->createProduct($postData, $storeId);
			$categoryId = $postData['category_id'] ?? null;
			$categoryIds = !empty($categoryId) ? [(int)$categoryId] : [];

			if (!empty($productId)) {
				$this->categoryService->updateForProduct((int)$productId, $categoryIds);
			}
            
            $this->redirect('/seller/products?status=product_created');

        } catch (ValidationException $e) {
            $this->render('pages/seller/products/create', [
				'categories' => $categories,
                'errors' => $e->getErrors(),
                'old' => $postData,
                'pageTitle' => 'Add Product',
				'cssFiles' => [
					'/css/pages/dashboard.css', 
					'https://cdn.quilljs.com/1.3.6/quill.snow.css',
					'/css/pages/seller/products/create.css'
				],
				'jsFiles' => [
					'https://cdn.quilljs.com/1.3.6/quill.js',
					'/js/utils/quill-setup.js', 
					'/js/pages/seller/products/create.js'
				],
            ]);
        } catch (Exception $e) {
            $this->render('pages/seller/products/create', [
				'categories' => $categories,
                'error' => $e->getMessage(),
                'old' => $postData,
                'pageTitle' => 'Add Product',
				'cssFiles' => [
					'/css/pages/dashboard.css', 
					'https://cdn.quilljs.com/1.3.6/quill.snow.css',
					'/css/pages/seller/products/create.css'
				],
				'jsFiles' => [
					'https://cdn.quilljs.com/1.3.6/quill.js',
					'/js/utils/quill-setup.js', 
					'/js/pages/seller/products/create.js'
				],
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

		$categories = $this->categoryService->getForDropdown();
		$assigned = $this->categoryService->getForProduct($productId);
		$assignedIds = array_column($assigned, 'category_id');

		$this->render('pages/seller/products/edit', [
			'product' => $product,
			'categories' => $categories,
			'assigned_category_ids' => $assignedIds,
			'old' => $_SESSION['old'] ?? [],
			'errors' => $_SESSION['errors'] ?? [],
            'pageTitle' => 'Edit Product',
            'cssFiles' => [
				'https://cdn.quilljs.com/1.3.6/quill.snow.css',
				'/css/pages/seller/products/edit.css',
				'/css/pages/dashboard.css'
			],
            'jsFiles' => [
                'https://cdn.quilljs.com/1.3.6/quill.js',
                '/js/utils/quill-setup.js', 
				'/js/pages/seller/products/edit.js'
            ],
		]);
	}

	public function updateProduct() { 
		$postData = $this->getPost(); 
		$productId = (int)($this->getQuery('id', 0) ?: ($postData['product_id'] ?? 0)); 

		if (isset($postData['product-description'])) {
            $plainText = trim(strip_tags($postData['product-description']));
            $postData['description_plain_text'] = $plainText;
		}

		$categories = $this->categoryService->getForDropdown();

		try { 
			$this->verifyCsrf(); 
			$postData['product_image'] = $_FILES['product_image'];

			$this->validate($postData, [ 
				'product_name' => ['required', 'min:0', 'max:200'], 
				'price' => ['required', 'numeric', 'numeric_min:1000'], 
				'stock' => ['required', 'numeric', 'numeric_min:0'],
				'description_plain_text' => ['max:1000'],
				'product_image' => [ 'size:2097152', 'mimes:jpeg,png,jpg,gif,webp']
			]); 

			$storeId = $this->getSellerStoreId(); 
			$this->productService->updateProduct($productId, $postData, $storeId); 

			$categoryId = $postData['category_id'] ?? null;
			$categoryIds = !empty($categoryId) ? [(int)$categoryId] : [];
			$this->categoryService->updateForProduct((int)$productId, $categoryIds);


			$this->redirect('/seller/products?status=product_updated');
		} catch (ValidationException $e) { 
			$this->render('pages/seller/products/edit', [ 
				'errors' => $e->getErrors(), 
				'old' => $postData, 
				'product' => array_merge(['product_id' => $productId], $postData),
				'categories' => $categories,
                'pageTitle' => 'Update Product',
                'cssFiles' => [
					'https://cdn.quilljs.com/1.3.6/quill.snow.css',
					'/css/pages/seller/products/edit.css',
					'/css/pages/dashboard.css'
					],
                'jsFiles' => [
                    'https://cdn.quilljs.com/1.3.6/quill.js',
                    '/js/utils/quill-setup.js', 
                    '/js/pages/seller/products/edit.js',
                ],
			]); 
		} catch (Exception $e) { 
			$this->render('pages/seller/products/edit', [
				'error' => $e->getMessage(), 
				'old' => $postData, 
				'product' => array_merge(['product_id' => $productId], $postData),
				'categories' => $categories,
                'pageTitle' => 'Update Product',
				'cssFiles' => [
					'https://cdn.quilljs.com/1.3.6/quill.snow.css',
					'/css/pages/seller/products/edit.css',
					'/css/pages/dashboard.css'
					],
                'jsFiles' => [
                    'https://cdn.quilljs.com/1.3.6/quill.js',
                    '/js/utils/quill-setup.js', 
                    '/js/pages/seller/products/edit.js',
                ],
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
        $isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
        strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';

        try {
            $this->verifyCsrf();
            $this->validate($post, [
                'store_name'        => ['required', 'min:0', 'max:100'],
                'store_description' => ['max:1000'],
            ]);

			$storeId = $this->getSellerStoreId();
			if (!$storeId) {
                throw new Exception('Store not found');
            }

            $row = $this->storeService->updateStore($post, $storeId);

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
                $this->redirect('/?status=store_updated'. ($row && isset($row['last_updated']) ? '&t='.$row['last_updated'] : ''));
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
                $this->redirect('/?error=' . urlencode($e->getFirstError()));
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
                $this->redirect('/?error=' . urlencode($e->getMessage()));
            }
        }
    }
}