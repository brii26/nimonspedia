<?php
class ProductController extends BaseController {
    private $productService;
    private $categoryService;
    private $reviewService;

    public function __construct() {
        parent::__construct();
        $this->productService = new ProductService();
        $this->categoryService = new CategoryService();
        $this->reviewService = new ReviewService();
    }

    public function index() {
        // Parse Price Range Logic
        $priceRange = $this->getQuery('priceRange');
        $minPrice = null;
        $maxPrice = null;
        if ($priceRange && str_contains($priceRange, '-')) {
            list($min, $max) = explode('-', $priceRange);
            $minPrice = ($min !== '') ? (int)$min : null;
            $maxPrice = ($max !== '') ? (int)$max : null;
        } else {
            // Fallback to direct min/max query params if provided
            $minPrice = $this->getQuery('min_price');
            $maxPrice = $this->getQuery('max_price');
        }

        // Handle perPage logic
        $perPageParam = $this->getQuery('perPage', '8');
        $perPage = 8; // Default

        if ($perPageParam === 'all') {
            $perPage = -1; // Unlimited
        } else {
            $perPage = (int)$perPageParam;
            $allowedPerPage = [4, 8, 12, 20];
            if (!in_array($perPage, $allowedPerPage)) {
                $perPage = 8;
            }
        }

        $options = [
            'page'       => (int)$this->getQuery('page', 1),
            'perPage'    => $perPage,
            'searchTerm' => $this->getQuery('searchTerm') ?? $this->getQuery('search'), // Support both
            'categoryId' => $this->getQuery('categoryId') ?? $this->getQuery('category'), // Support both
            'minPrice'   => $minPrice,
            'maxPrice'   => $maxPrice,
            'priceRange' => $priceRange // Optional pass-through
        ];

        $productService = new ProductService();
        $productsData = $productService->getAllProducts($options);

        // Pure Public Data - No Session Info
        header('Content-Type: application/json');
        echo json_encode($productsData);
        exit;
    }

    public function show() {
        $productId = $this->getQuery('id');
        if (!$productId) {
            $this->redirect('/');
            return;
        }

        $product = $this->productService->getProductById($productId);
        if (!$product) {
            $this->handle404();
            return;
        }

        $recommendations = [];
        $categories = $this->categoryService->getForProduct($productId);

        if (!empty($categories)) {
            $firstCategoryId = $categories[0]['category_id'];

            $productRepo = new ProductRepository();
            $recommendations = $productRepo->getRecommendations($firstCategoryId, $productId, 4);
        }

        // Get review stats
        $reviewStats = $this->reviewService->getProductStats($productId);
        
        // Get initial reviews (first page, 3 per page)
        $initialReviews = $this->reviewService->getProductReviews($productId, 1, 3);

        $this->render('pages/products/show', [
            'product' => $product,
            'recommendations' => $recommendations,
            'reviewStats' => $reviewStats,
            'initialReviews' => $initialReviews['data'],
            'reviewsPagination' => $initialReviews,
            'pageTitle' => View::escape($product['product_name']),
            'jsFiles' => [
                '/js/utils/fetchXhr.js', 
                '/js/components/product-reviews.js',
                '/js/pages/products/show.js'
            ],
            'cssFiles' => [
                '/css/pages/product-detail.css',
                '/css/components/reviews.css'
            ]
        ]);
    }
}