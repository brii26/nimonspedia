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
            if ($quantity <= 0) {
                return $this->error('Kuantitas harus lebih dari nol', 422);
            }

            $count = 0;

            if (Auth::isBuyer()) {
                // --- LOGIKA UNTUK BUYER ---
                $buyerId = Auth::id();

                $this->cartService->mergeSessionToPersistent($buyerId);
                $count = $this->cartService->addOrUpdateDbCart($buyerId, $productId, $quantity);
            
            } else {
                // --- LOGIKA UNTUK GUEST ---
                $product = $this->cartService->getProductForValidation($productId); // Perlu method baru di service
                if (!$product) throw new ValidationException('Produk tidak ditemukan');
                $available = isset($product['stock']) ? (int)$product['stock'] : PHP_INT_MAX;
                if ($available <= 0) throw new ValidationException('Produk habis');

                if (!isset($_SESSION['cart']) || !is_array($_SESSION['cart'])) {
                    $_SESSION['cart'] = [];
                }
                
                $existingQty = isset($_SESSION['cart'][$productId]) ? (int)$_SESSION['cart'][$productId]['quantity'] : 0;
                $newQty = $existingQty + $quantity;
                
                if ($newQty > $available) {
                    // Jangan lempar error, cap saja di jumlah stok untuk guest
                    $newQty = $available; 
                }

                $_SESSION['cart'][$productId] = [
                    'product_id' => $productId,
                    'quantity' => $newQty,
                    'product_name' => $product['product_name'] ?? ($product['name'] ?? ''),
                    'product_price' => $product['price'] ?? 0
                ];

                $count = count($_SESSION['cart']);
            }
            
            return $this->success('Item berhasil ditambahkan', ['uniqueCount' => $count]);

        } catch (ValidationException $ve) {
            return $this->error($ve->getFirstError(), 422);
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
            $unique = 0;
            
            if (Auth::isBuyer()) {
                $unique = $this->cartService->getDbUniqueCountByBuyer(Auth::id());
            } else {
                if (!empty($_SESSION['cart']) && is_array($_SESSION['cart'])) {
                    $unique = count($_SESSION['cart']);
                }
            }
            
            $this->json(['unique' => $unique]);

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
