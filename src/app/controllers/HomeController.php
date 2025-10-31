<?php
class HomeController extends BaseController {
    
    private $storeService;
    private $statsService;
    private $productService;

    public function __construct() {
        parent::__construct();
        $this->storeService = new StoreService();
        $this->statsService = new StatsService();
        $this->productService = new ProductService();
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
        
        $options = [
            'page'       => (int)$this->getQuery('page', 1),
            'perPage'    => 8,
            'searchTerm' => $this->getQuery('search'),
            'categoryId' => $this->getQuery('category'),
            'minPrice'   => $this->getQuery('min_price'),
            'maxPrice'   => $this->getQuery('max_price'),
        ];

        $productsData = $this->productService->getAllProducts($options); 
        $this->render('pages/products/index', [
            'productsData' => $productsData,
            'pageTitle' => 'Browse Products',
            'jsFiles' => [
                '/js/utils/fetchXhr.js',
                '/js/pages/products/index.js'
            ],
            'cssFiles'=> [
                'css/pages/products-index.css'
            ]
        ]);
        return;
    }
}