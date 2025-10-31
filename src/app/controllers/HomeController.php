<?php

class HomeController extends BaseController {
    
    /**
     * Handle root route - redirect based on authentication status
     */
    public function index() {
        if (Auth::check()) {
            $user = Auth::user();
            $this->redirect('/dashboard'); 
        } else {
            $productService = new ProductService();
            $options = [
                'page'       => $this->getQuery('page', 1),
                'searchTerm' => $this->getQuery('search'),
                'categoryId' => $this->getQuery('category'),
                'minPrice'   => $this->getQuery('min_price'),
                'maxPrice'   => $this->getQuery('max_price'),
            ];
            $productsData = $productService->getAllProducts($options);
            $this->render('pages/products/index', ['productsData' => $productsData]);
            return;
        }
    }
}
