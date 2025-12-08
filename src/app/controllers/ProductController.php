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
        $options = [
            'page'       => (int)$this->getQuery('page', 1),
            'perPage'    => 8,
            'searchTerm' => $this->getQuery('search'),
            'categoryId' => $this->getQuery('category'),
            'minPrice'   => $this->getQuery('min_price'),
            'maxPrice'   => $this->getQuery('max_price'),
        ];

        $productService = new ProductService();
        $productsData = $productService->getAllProducts($options);
        $this->render('pages/products/index', [
            'productsData' => $productsData,
            'pageTitle' => 'Browse Products',
            'jsFiles' => [
                '/js/utils/fetchXhr.js',
                '/js/pages/products/index.js'
            ],
            'cssFiles' => [
                '/css/pages/products-index.css'
            ]
        ]);
        return;
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
        
        // Get initial reviews (first page)
        $initialReviews = $this->reviewService->getProductReviews($productId, 1, 5);

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