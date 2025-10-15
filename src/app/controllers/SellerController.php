<?php

class SellerController extends BaseController {
    private $productService;

    public function __construct() {
        parent::__construct();
        $this->productService = new ProductService();
        $this->requireRole('SELLER');
    }

    public function createProductForm() {
        $this->render('pages/seller/products/create');
    }

    public function listProducts() {
        $storeId = Auth::user()['store_id'];
        $options = [
            'page' => $this->getQuery('page', 1),
            'store_id' => $storeId 
        ];
        $productsData = $this->productService->getAllProducts($options);
        
        $this->render('pages/seller/products/index', ['productsData' => $productsData]);
    }

    public function storeProduct() {
        $postData = $this->getPost();

        try {
            $this->verifyCsrf();
            $this->validate($postData, [
                'product_name' => ['required', 'min:3'],
                'price' => ['required', 'numeric'],
                'stock' => ['required', 'numeric']
            ]);

            $storeId = Auth::user()['store_id'];
            $this->productService->createProduct($postData, $storeId);
            
            $this->redirect('/dashboard?status=product_created');

        } catch (ValidationException $e) {
            $this->render('pages/seller/products/create', [
                'errors' => $e->getErrors(),
                'old' => $postData
            ]);
        } catch (Exception $e) {
            $this->render('pages/seller/products/create', [
                'error' => $e->getMessage(),
                'old' => $postData
            ]);
        }
    }
}