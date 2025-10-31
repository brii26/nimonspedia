<?php

/**
 * ProductController handles HTTP requests for product-related actions.
 * It extends BaseController to leverage shared functionalities like rendering views and handling redirects.
 */
class ProductController extends BaseController {
    private $productService;

    public function __construct() {
        parent::__construct();
        $this->productService = new ProductService();
    }

    /**
     * Displays the detail page for a single product.
     */
    public function show() {
        $productId = $this->getQuery('id');
        if (!$productId) {
            $this->render('pages/errors/404');
            return;
        }

        $product = $this->productService->getProductById($productId);
        if (!$product) {
            $this->render('pages/errors/404');
            return;
        }

        $this->render('pages/products/show', ['product' => $product]);
    }
}