<?php

class StoreController extends BaseController {
    
    private $productService;
    private $storeRepository;
    private $categoryService;

    public function __construct() {
        parent::__construct();
        $this->productService = new ProductService(); 
        $this->storeRepository = new StoreRepository(); 
        $this->categoryService = new CategoryService();
    }

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

        $allowedPerPag = [4, 8, 12, 20];
        $perPage = (int)$this->getQuery('perPage', 8);
        if (!in_array($perPage, $allowedPerPag)) $perPage = 8;
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
            'store_id'   => $storeId
        ];

        $productsData = $this->productService->getAllProducts($filters);
        $categories = $this->categoryService->getAllCategories();
        
        $isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
                  strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
                  
        $actionUrl = '/store';

        if ($isAjax) {
            $html = View::component('product-list', [
                'productsData' => $productsData,
                'filters' => $filters,
                'actionUrl' => $actionUrl,
                'extraHiddenFields' => ['id' => $storeId]
            ]);
            $this->json(['html' => $html]);
            return;
        }

        $this->render('pages/stores/detail', [
            'store'        => $storeInfo,
            'productsData' => $productsData,
            'categories'   => $categories,
            'filters'      => $filters,
            'actionUrl'    => $actionUrl,
            'pageTitle'    => View::escape($storeInfo['store_name']),
            'cssFiles' => [
                '/css/pages/store-detail.css',
                '/css/components/product-filter.css',
                'css/components/modal.css'
            ],
            'jsFiles' => [
                '/js/utils/fetchXhr.js',
                '/js/pages/products/index.js',
                '/js/components/product-filter.js',
            ],
        ]);
    }

    // API endpoint untuk mendapatkan stores dalam JSON (untuk chat new chat modal)
    public function api() {
        $search = $this->getQuery('search', '');
        $page = (int)$this->getQuery('page', 1);
        $limit = (int)$this->getQuery('limit', 20);
        
        $stores = $this->storeRepository->searchStores($search, $page, $limit);
        
        $this->json([
            'success' => true,
            'data' => $stores
        ]);
    }
}