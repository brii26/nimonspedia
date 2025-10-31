<?php

class HomeController extends BaseController {
    
    /**
     * Handle root route - redirect based on authentication status
     */
    public function index() {
        if (Auth::check()) {
            $user = Auth::user();
            if ($user['role'] === 'SELLER') {
                $this->render('pages/dashboard/seller', ['user' => $user]);
                return;
            }
        }

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
        $this->render('pages/products/index', ['productsData' => $productsData]);
        return;
    }
}
