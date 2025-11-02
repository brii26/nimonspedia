<?php

class CartController extends BaseController {
    /** @var CartService */
    private $cartService;

    public function __construct() {
        parent::__construct();
        $productRepo = new ProductRepository();
        $cartItemRepo = new CartItemRepository();
        $this->cartService = new CartService($productRepo, $cartItemRepo);
    }

    /**
     * Show cart page
     */
    public function index() {
        try {
            $cart = $this->cartService->getCart();
            $this->render('pages/cart/index', ['cart' => $cart]);
        } catch (Exception $e) {
            error_log('Cart index error: ' . $e->getMessage());
            $this->render('pages/cart/index', ['cart' => ['items' => [], 'total' => 0], 'error' => $e->getMessage()]);
        }
    }

    /**
     * Add product to cart (POST)
     */
    public function add() {
        try {
            $this->verifyCsrf();
            $productId = (int)$this->getPost('product_id');
            $quantity = (int)($this->getPost('quantity', 1));

            if ($productId <= 0) {
                return $this->error('Produk tidak valid', 422);
            }

            $count = $this->cartService->addToCart($productId, $quantity);
            return $this->success('Item berhasil ditambahkan', ['uniqueCount' => $count]);

        } catch (ValidationException $ve) {
            return $this->error($ve->getFirstError(), 422);;
        
        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Update quantity (POST)
     */
    public function update() {
        try {
            $this->verifyCsrf();
            $productId = (int)$this->getPost('product_id');
            $quantity = (int)$this->getPost('quantity', 0);

            if ($productId <= 0) return $this->error('Invalid product id', 422);
            if ($quantity < 0) return $this->error('Invalid quantity', 422);

            $res = $this->cartService->updateQuantity($productId, $quantity);
            return $this->success('Cart updated', ['updated' => (bool)$res]);
        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Remove item (POST)
     */
    public function remove() {
        try {
            $this->verifyCsrf();
            $productId = (int)$this->getPost('product_id');
            if ($productId <= 0) return $this->error('Invalid product id', 422);

            $res = $this->cartService->removeItem($productId);
            return $this->success('Item removed', ['removed' => (bool)$res]);
        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Return cart counts for navbar (JSON)
     */
    public function count() {
        try {
            $unique = $this->cartService->getUniqueCount();
            $units = $this->cartService->getTotalUnitsCount();
            $this->json(['unique' => $unique, 'units' => $units]);
        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
