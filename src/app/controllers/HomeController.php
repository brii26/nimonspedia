<?php
class HomeController extends BaseController {
    
    private $storeService;
    private $statsService;
    private $productService;
    private $categoryService;

    public function __construct() {
        parent::__construct();
        $this->storeService = new StoreService();
        $this->statsService = new StatsService();
        $this->productService = new ProductService();
        $this->categoryService = new CategoryService();
    }

    /**
     * - Jika Seller: Tampilkan Dashboard Seller
     * - Jika Buyer/Guest: Tampilkan Daftar Produk
     */
    public function index() {
        $user = Auth::user();

        if ($user && $user['role'] === 'SELLER') {
            
            $view = 'pages/dashboard/seller';
            $data = ['user' => $user];
            $store = $this->storeService->getStoreForUser($user['user_id']);
            
            if ($store && isset($store['store_id'])) {
                $storeId = (int)$store['store_id'];
                $data['stats'] = $this->statsService->getSellerStats($storeId);
                $data['store'] = $store ?: ['store_name' => '', 'store_description' => ''];
            }

            $jsFiles = [
                '/js/pages/dashboard/seller.js',
                'https://cdn.quilljs.com/1.3.6/quill.js',
                '/js/utils/quill-setup.js',
                'js/utils/fetchXhr.js'
            ];
            $cssFiles = [
                'css/pages/dashboard.css',
                'https://cdn.quilljs.com/1.3.6/quill.snow.css',
                'css/pages/seller/store.css'
            ];

            $this->render($view, array_merge($data, [
                'user' => $user,
                'pageTitle' => 'Dashboard',
                'cssFiles' => $cssFiles,
                'jsFiles' => $jsFiles
            ]));

            return;
        } 

        $allowedPerPag = [4, 8, 12, 20];
        $perPage = (int)$this->getQuery('perPage', 8);
        if (!in_array($perPage, $allowedPerPag)) {
            $perPage = 8;
        }

        $priceRange = $this->getQuery('priceRange');
        $minPrice = null;
        $maxPrice = null;

        if ($priceRange && str_contains($priceRange, '-')) {
            list($min, $max) = explode('-', $priceRange);
            $minPrice = ($min !== '') ? (int)$min : null;
            $maxPrice = ($max !== '') ? (int)$max : null;
        }
        
        $filters = [
            'page'       => (int)$this->getQuery('page', 1),
            'perPage'    => $perPage,
            'searchTerm' => $this->getQuery('searchTerm'),
            'categoryId' => $this->getQuery('categoryId'),
            'minPrice'   => $minPrice,
            'maxPrice'   => $maxPrice,
            'priceRange' => $priceRange,
        ];

        $productsData = $this->productService->getAllProducts($filters);
        $categories = $this->categoryService->getForDropdown();
        $this->render('pages/products/index', [
            'productsData' => $productsData,
            'categories'   => $categories,
            'filters'      => $filters,
            'pageTitle' => 'Browse Products',
            'jsFiles' => [
                '/js/utils/fetchXhr.js',
                '/js/pages/products/index.js',
                '/js/components/product-filter.js'
            ],
            'cssFiles'=> [
                'css/pages/products-index.css',
                'css/components/product-filter.css'
            ]
        ]);
        return;
    }
}