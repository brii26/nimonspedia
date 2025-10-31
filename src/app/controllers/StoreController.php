<?php

class StoreController extends BaseController {
    
    private $productService;
    private $storeRepository;
    private $categoryService; // <-- TAMBAHKAN INI

    public function __construct() {
        parent::__construct();
        $this->productService = new ProductService(); 
        $this->storeRepository = new StoreRepository(); 
        $this->categoryService = new CategoryService(); // <-- TAMBAHKAN INI
    }

    /**
     * Menampilkan halaman detail toko (etalase)
     */
    public function show() {
        $storeId = (int)$this->getQuery('id');
        if (!$storeId) {
            $this->redirect('/');
            return;
        }

        $storeInfo = $this->storeRepository->find($storeId); 
        if (!$storeInfo) {
            $this->handle404();
            return;
        }

        // --- MULAI PERUBAHAN ---

        // 1. Validasi perPage
        $allowedPerPag = [4, 8, 12, 20];
        $perPage = (int)$this->getQuery('perPage', 8);
        if (!in_array($perPage, $allowedPerPag)) {
            $perPage = 8; // Default
        }

        // 2. Parsing Price Range
        $priceRange = $this->getQuery('priceRange');
        $minPrice = null;
        $maxPrice = null;
        
        if ($priceRange && str_contains($priceRange, '-')) {
            list($min, $max) = explode('-', $priceRange);
            $minPrice = ($min !== '') ? (int)$min : null;
            $maxPrice = ($max !== '') ? (int)$max : null;
        }

        // 3. Bangun array filter
        $filters = [
            'page'       => (int)$this->getQuery('page', 1),
            'perPage'    => $perPage,
            'searchTerm' => $this->getQuery('searchTerm'),
            'categoryId' => $this->getQuery('categoryId'),
            'minPrice'   => $minPrice,
            'maxPrice'   => $maxPrice,
            'priceRange' => $priceRange,
            'store_id'   => $storeId // <-- Kunci untuk toko ini
        ];

        // 4. Ambil produk DAN kategori
        $productsData = $this->productService->getAllProducts($filters);
        $categories = $this->categoryService->getForDropdown();

        // 5. Render view dengan data baru
        $this->render('pages/stores/detail', [
            'store'        => $storeInfo,
            'productsData' => $productsData,
            'categories'   => $categories,
            'filters'      => $filters,
            'pageTitle'    => View::escape($storeInfo['store_name']),
            'cssFiles' => [
                '/css/pages/store-detail.css',
                '/css/components/product-filter.css'
            ],
            'jsFiles' => [
                '/js/utils/fetchXhr.js',
                '/js/pages/products/index.js'
            ],
        ]);
    }
}