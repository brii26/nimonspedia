<?php

require_once 'app/controllers/BaseController.php';
require_once 'app/services/ProductService.php';

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
     * Displays the public product listing page (Product Discovery).
     */
    public function index() {
        $options = [
            'page'       => $this->getQuery('page', 1),
            'searchTerm' => $this->getQuery('search'),
            'categoryId' => $this->getQuery('category'),
            'minPrice'   => $this->getQuery('min_price'),
            'maxPrice'   => $this->getQuery('max_price'),
        ];

        $productsData = $this->productService->getAllProducts($options);
        $this->render('pages/products/index', ['productsData' => $productsData]);
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

    // ===================================================
    // =============== SELLER ACTIONS ====================
    // ===================================================

    /**
     * Displays the form for creating a new product. (Seller only)
     */
    public function create() {
        $this->requireRole('SELLER');
        $this->render('pages/products/create');
    }

    /**
     * Handles the submission of the new product form. (Seller only)
     */
    public function store() {
        $this->requireRole('SELLER');
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
            
            $this->redirect('/dashboard/seller?status=product_created');

        } catch (ValidationException $e) {
            $this->render('pages/products/create', [
                'errors' => $e->getErrors(),
                'old' => $postData
            ]);
        } catch (Exception $e) {
            $this->render('pages/products/create', [
                'error' => $e->getMessage(),
                'old' => $postData
            ]);
        }
    }
}