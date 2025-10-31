<?php

class StoreController extends BaseController {
    
    private $productService;
    private $storeRepository;

    public function __construct() {
        parent::__construct();
        $this->productService = new ProductService(); 
        $this->storeRepository = new StoreRepository(); 
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

        $options = [
            'page'       => (int)$this->getQuery('page', 1),
            'perPage'    => (int)$this->getQuery('perPage', 8),
            'searchTerm' => $this->getQuery('search'),
            'categoryId' => $this->getQuery('category'),
            'minPrice'   => $this->getQuery('min_price'),
            'maxPrice'   => $this->getQuery('max_price'),
            'store_id'   => $storeId
        ];

        $productsData = $this->productService->getAllProducts($options);

        $this->render('pages/stores/detail', [
            'store'        => $storeInfo,
            'productsData' => $productsData,
            'pageTitle'    => View::escape($storeInfo['store_name']),
            'cssFiles' => [
                '/css/pages/store-detail.css'
            ],
            'jsFiles' => [
                '/js/utils/fetchXhr.js',
                '/js/pages/products/index.js'
            ],
        ]);
    }
}