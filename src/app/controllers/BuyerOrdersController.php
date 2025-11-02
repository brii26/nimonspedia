<?php

class BuyerOrdersController extends BaseController {
    private $buyerOrderService;
    private $cartService;
    private $orderRepository;
    private $authService;
    
    public function __construct() {
        parent::__construct();
        $this->requireAuth(); 
        $this->orderRepository = new OrderRepository();
        $this->cartService = new CartService(new ProductRepository(), new CartItemRepository());
        $this->buyerOrderService = new BuyerOrderService(
            $this->orderRepository,
            $this->cartService
        );
        $this->authService = new AuthService();
    }
    
    /**
     * Show list of buyer's orders
     */
    public function index() {
        $this->requireRole('BUYER');
        
        try {
            $page = (int)($this->getQuery('page', 1));
            $status = $this->getQuery('status');
            $perPage = 10;
            
            // Logika ini tetap sama
            $ordersData = $this->buyerOrderService->getBuyerOrders(
                Auth::user()['user_id'],
                $page,
                $perPage,
                $status
            );
            
            // Data yang akan dikirim ke view (baik full/partial)
            $viewData = [
                'orders' => $ordersData['data'],
                'current_page' => $page,
                'total_pages' => $ordersData['total_pages'],
                'currentStatus' => $status, // Diganti dari 'status_filter'
                'status_filter' => $status  // Jaga-jaga
            ];

            if ($this->isAjax()) {
                $html = View::render('components/order-list', $viewData);
                $this->json(['html' => $html]);
                return;
            }

            $this->render('pages/orders/index', array_merge($viewData, [
                // Load CSS DAN JS baru kita
                'cssFiles' => ['/css/pages/seller/orders.css'],
                'jsFiles' => ['/js/utils/fetchXhr.js', '/js/pages/orders/index.js']
            ]));
            
        } catch (Exception $e) {
            error_log('Error fetching orders: ' . $e->getMessage());
            
            if ($this->isAjax()) {
                $this->json(['html' => '<div class="empty-state"><p>Gagal memuat pesanan.</p></div>'], 500);
                return;
            }
            
            $this->render('pages/orders/index', [
                'orders' => [],
                'current_page' => 1,
                'total_pages' => 0,
                'currentStatus' => $status,
                'status_filter' => $status,
                'error' => 'Failed to load orders',
                'cssFiles' => ['/css/pages/seller/orders.css'],
                'jsFiles' => ['/js/utils/fetchXhr.js', '/js/pages/orders/index.js']
            ]);
        }
    }
    
    /**
     * Show details of specific order
     */
    public function show() {
        $this->requireRole('BUYER');
        
        try {
            $orderId = (int)$this->getQuery('id');
            if (!$orderId) {
                $this->redirect('/orders');
                return;
            }
            
            $order = $this->buyerOrderService->getBuyerOrderDetails($orderId, Auth::user()['user_id']);
            if (!$order) {
                $this->redirect('/orders');
                return;
            }
            
            $this->render('pages/orders/show', [
                'order' => $order,
                // Load CSS DAN JS baru kita
                'cssFiles' => ['/css/pages/seller/orders.css'],
                'jsFiles' => ['/js/utils/fetchXhr.js', '/js/pages/orders/index.js']
            ]);
            
        } catch (Exception $e) {
            error_log('Error showing order: ' . $e->getMessage());
            $this->redirect('/orders');
        }
    }

    /**
     * Buyer confirms that an on_delivery order has been received.
     */
    public function confirmReceived() {
        $this->requireRole('BUYER');
        $this->verifyCsrf();

        try {
            $orderId = (int)($this->getPost('order_id'));
            if (!$orderId) {
                $this->redirect('/orders?error=' . urlencode('Order tidak valid'));
                return;
            }

            $buyerId = Auth::user()['user_id'];
            $ok = $this->orderRepository->confirmReceived($orderId, $buyerId);
            if ($ok) {
                $this->redirect('/orders?success=' . urlencode('Pesanan dikonfirmasi diterima.'));
            } else {
                $this->redirect('/orders?error=' . urlencode('Tidak dapat mengkonfirmasi pesanan. Pastikan status sudah on_delivery dan estimasi pengiriman terlewati.'));
            }

        } catch (Exception $e) {
            error_log('Error confirming received: ' . $e->getMessage());
            $this->redirect('/orders?error=' . urlencode('Terjadi kesalahan saat mengkonfirmasi pesanan.'));
        }
    }
    
    public function showCheckoutPage() {
        $this->requireRole('BUYER');
        
        try {
            $buyerId = Auth::user()['user_id'];
            $user = Auth::user();
            
            $cartData = $this->cartService->getCart($buyerId);
            
            if (empty($cartData['items'])) {
                $this->redirect('/cart');
                return;
            }
            
            $this->render('pages/orders/checkout', [
                'cart' => $cartData,
                'user' => $user,
                'jsFiles' => ['/js/components/confirm-modal.js', '/js/utils/fetchXhr.js',]
            ]);
            
        } catch (Exception $e) {
            error_log('Error showing checkout page: ' . $e->getMessage());
            $this->redirect('/cart?error=' . urlencode('Could not load checkout page.'));
        }
    }

    /**
     * Create new order from cart (checkout)
     */
    public function checkout() {
        $this->requireRole('BUYER');
        $this->verifyCsrf();
        
        try {
            // Pre-validation to get more specific error messages
            $userId = Auth::user()['user_id'];
            $cart = $this->cartService->getCart($userId);
            
            if (empty($cart['items'])) {
                $this->redirect('/cart?error=' . urlencode("Keranjang belanja Anda kosong."));
                return;
            }

            $shippingAddress = $this->getPost('shipping_address', null);
            $order = $this->buyerOrderService->createFromCart($userId, $shippingAddress);
            
            if ($order) {
                $updatedUser = $this->authService->getUserById($userId);
                Auth::updateSession($updatedUser);
                $this->redirect('/orders/show?id=' . $order['order_id']);
                return;
            } else {
                throw new Exception('Failed to create order');
            }
            
        } catch (PDOException $e) {
            error_log("Checkout PDO Error: " . $e->getMessage());
            $this->redirect('/cart?error=' . urlencode("Database error during checkout: " . $e->getMessage()));
        } catch (ValidationException $e) {
            error_log("Checkout Validation Error: " . $e->getMessage());
            $this->redirect('/cart?error=' . urlencode($e->getMessage()));
        } catch (Exception $e) {
            error_log("Checkout Error: " . $e->getMessage());
            $this->redirect('/cart?error=' . urlencode("Unexpected error during checkout: " . $e->getMessage()));
        }
    }
}