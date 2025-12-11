<?php


class SellerController extends BaseController {
    private $productService;
    private $storeService;
	private $categoryService;
	private $sanitizerService;


    public function __construct() {
        parent::__construct();
        $this->productService = new ProductService();
        $this->storeService = new StoreService();
		$this->categoryService = new CategoryService();
		$this->sanitizerService = new SanitizerService();

        $this->requireRole('SELLER');
    }

    public function createProductForm() {
		$categories = $this->categoryService->getAllCategories();
		$this->render('pages/seller/products/create', [
			'categories' => $categories,
			'old' => $_SESSION['old'] ?? [],
			'errors' => $_SESSION['errors'] ?? [],
            'pageTitle' => 'Create Product',
            'cssFiles' => [
				'/css/pages/dashboard.css', 
				'https://cdn.quilljs.com/1.3.6/quill.snow.css',
				'/css/pages/seller/products/create.css',
				'https://cdn.jsdelivr.net/npm/tom-select@2.3.1/dist/css/tom-select.bootstrap5.min.css'
			],
            'jsFiles' => [
                'https://cdn.quilljs.com/1.3.6/quill.js',
                '/js/utils/quill-setup.js', 
				'/js/pages/seller/products/create.js',
				'https://cdn.jsdelivr.net/npm/tom-select@2.3.1/dist/js/tom-select.complete.min.js'
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
		$search  = $_GET['searchTerm'] ?? '';
		$catId   = $_GET['categoryId'] ?? null;
		$sortBy  = $_GET['sortBy'] ?? '';
		$sortDir = strtoupper($_GET['sortDir'] ?? 'ASC');
		$page    = (int)($_GET['page'] ?? 1);
		$perPage = (int)($_GET['perPage'] ?? 8);
		$stock   = $_GET['stock'] ?? '';
	
		$options = [
			'store_id' => $storeId,
			'searchTerm' => $search,
			'categoryId' => $catId ?: null,
			'page' => max(1, $page),
			'perPage' => in_array($perPage, [4, 8, 12, 20], true) ? $perPage : 8,
			'sortBy' => in_array($sortBy, ['name', 'price', 'stock'], true) ? $sortBy : null,
			'sortDir' => $sortDir === 'DESC' ? 'DESC' : 'ASC',
			'stock' => $stock,
            'includeCategories' => true
		];
	
		$productsData = $this->productService->getAllProducts($options);
		$categories   = $this->categoryService->getAllCategories();
		$isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH'])
			   && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
		
		if ($isAjax) {
			try {
				$html = View::render('pages/seller/products/index', [
					'productsData' => $productsData,
					'categories' => $categories,
					'filters' =>[
						'searchTerm' => $search,
						'categoryId' => $catId,
						'sortBy' => $sortBy,
						'sortDir' => $sortDir,
						'perPage' => $perPage
					],
					'actionUrl' => '/seller/products',
					'fragment' => true
				]);
		
				while (ob_get_level()) { ob_end_clean(); }
				header('Content-Type: application/json; charset=utf-8');
				echo json_encode(['html' => $html], JSON_UNESCAPED_UNICODE);
				exit;
			} catch (Throwable $e) {
				while (ob_get_level()) { ob_end_clean(); }
				header('Content-Type: application/json; charset=utf-8', true, 500);
				echo json_encode(['error' => 'render_failed', 'message' => $e->getMessage()]);
				exit;
			}
		}
			
		$this->render('pages/seller/products/index', [
			'productsData' => $productsData,
			'categories' => $categories,
			'filters' => [
				'searchTerm' => $search,
				'categoryId' => $catId,
				'sortBy' => $sortBy,
				'sortDir' => $sortDir,
				'perPage' => $perPage,
				'stock' => $stock
			],
			'actionUrl' => '/seller/products',
			'pageTitle' => 'Your Products',
			'cssFiles'  => [
				'/css/pages/dashboard.css',
				'/css/pages/seller/products/index.css',
				'/css/components/auction-modal.css'
			],
			'jsFiles' => [
				'/js/utils/fetchXhr.js',
				'/js/pages/seller/products/index.js',
				'/js/components/auction-modal.js'
			]
		]);
	}
	
	public function filter() {
        $data = json_decode(file_get_contents('php://input'), true);
        $storeId = $this->getSellerStoreId();

        $options = [
			$options = [
				'store_id' => $storeId,
				'searchTerm' => $data['search'] ?? '',
				'categoryId' => $data['category_id'] ?? null,
				'sortBy' => in_array($data['sort_by'] ?? '', ['name','price','stock'], true) ? $data['sort_by'] : null,
				'sortDir' => (strtoupper($data['sort_dir'] ?? 'ASC') === 'DESC') ? 'DESC' : 'ASC',
				'page' => max(1, (int)($data['page'] ?? 1)),
				'perPage' => in_array((int)($data['perPage'] ?? 8), [4,8,12,20], true) ? (int)$data['perPage'] : 8,
			  ]
        ];

        $result = $this->productService->getAllProducts($options);
        echo json_encode($result);
    }

    public function storeProduct() {
        $postData = $this->getPost();

		$postData['product-description'] = $this->sanitizerService->sanitizeRichText($postData['product-description'] ?? null);
        $plainText = trim(strip_tags($postData['product-description']));
        $postData['description_plain_text'] = $plainText;

		$categories = $this->categoryService->getAllCategories();

        try {
            $this->verifyCsrf();
			$postData['product_image'] = $_FILES['product_image'];

			$this->validate($postData, [ 
				'product_name' => ['required', 'min:0', 'max:200'], 
				'price' => ['required', 'numeric', 'numeric_min:1000'], 
				'stock' => ['required', 'numeric', 'numeric_min:0'],
				'description_plain_text' => ['max:1000'],
				'product_image' => [ 'size:2097152', 'mimes:jpeg,png,jpg,gif,webp'],
				'category_ids' => ['required', 'array']
			]); 

			$storeId = $this->getSellerStoreId();

			$productId = $this->productService->createProduct($postData, $storeId);

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

		$categories = $this->categoryService->getAllCategories();
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
				'/css/pages/dashboard.css',
				'https://cdn.jsdelivr.net/npm/tom-select@2.3.1/dist/css/tom-select.bootstrap5.min.css'
			],
            'jsFiles' => [
                'https://cdn.quilljs.com/1.3.6/quill.js',
                '/js/utils/quill-setup.js', 
				'/js/pages/seller/products/edit.js',
				'https://cdn.jsdelivr.net/npm/tom-select@2.3.1/dist/js/tom-select.complete.min.js'
            ],
		]);
	}

	public function updateProduct() { 
		$postData = $this->getPost(); 
		$productId = (int)($this->getQuery('id', 0) ?: ($postData['product_id'] ?? 0)); 

		$postData['product-description'] = $this->sanitizerService->sanitizeRichText($postData['product-description'] ?? null);
        $plainText = trim(strip_tags($postData['product-description']));
        $postData['description_plain_text'] = $plainText;

		$categories = $this->categoryService->getAllCategories();

		try { 
			$this->verifyCsrf(); 
			$postData['product_image'] = $_FILES['product_image'];

			$this->validate($postData, [ 
				'product_name' => ['required', 'min:0', 'max:200'], 
				'price' => ['required', 'numeric', 'numeric_min:1000'], 
				'stock' => ['required', 'numeric', 'numeric_min:0'],
				'description_plain_text' => ['max:1000'],
				'product_image' => [ 'size:2097152', 'mimes:jpeg,png,jpg,gif,webp'],
				'category_ids' => ['required', 'array']
			]); 

			$storeId = $this->getSellerStoreId(); 
			$this->productService->updateProduct($productId, $postData, $storeId); 

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
			$post['store_description'] = $this->sanitizerService->sanitizeRichText($post['store_description'] ?? null);

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