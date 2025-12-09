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
            $ordersData = $this->buyerOrderService->getBuyerOrders(
                Auth::user()['user_id'],
                $page,
                $perPage,
                $status
            );
            
            // If AJAX request, return JSON for infinite scroll
            if ($this->isAjax()) {
                $this->json([
                    'success' => true,
                    'data' => $ordersData['data'],
                    'page' => $page,
                    'has_more' => $ordersData['has_more'] ?? false
                ]);
                return;
            }
            
            // Data untuk view
            $viewData = [
                'orders' => $ordersData['data'],
                'current_page' => $page,
                'total_pages' => $ordersData['total_pages'],
                'has_more' => $ordersData['has_more'] ?? false,
                'currentStatus' => $status,
                'status_filter' => $status
            ];

            $this->render('pages/orders/index', array_merge($viewData, [
                'cssFiles' => ['/css/pages/seller/orders.css'],
                'jsFiles' => ['/js/utils/fetchXhr.js', '/js/pages/orders/index.js']
            ]));
            
        } catch (Exception $e) {
            error_log('Error fetching orders: ' . $e->getMessage());
            
            if ($this->isAjax()) {
                $this->json(['success' => false, 'message' => 'Gagal memuat pesanan.'], 500);
                return;
            }
            
            $this->render('pages/orders/index', [
                'orders' => [],
                'current_page' => 1,
                'total_pages' => 0,
                'has_more' => false,
                'currentStatus' => $status ?? null,
                'status_filter' => $status ?? null,
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
                'cssFiles' => [
                    '/css/pages/seller/orders.css',
                    '/css/pages/orders-detail.css'
                ],
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
                $this->json(['success' => false, 'message' => 'Order tidak valid'], 400);
                return;
            }

            $buyerId = Auth::user()['user_id'];
            $ok = $this->orderRepository->confirmReceived($orderId, $buyerId);
            if ($ok) {
                $this->json(['success' => true, 'message' => 'Pesanan dikonfirmasi diterima.']);
            } else {
                $this->json([
                    'success' => false, 
                    'message' => 'Tidak dapat mengkonfirmasi pesanan. Pastikan status sudah "on_delivery" dan estimasi pengiriman terlewati.'
                ], 422);
            }

        } catch (Exception $e) {
            error_log('Error confirming received: ' . $e->getMessage());
            $this->json(['success' => false, 'message' => 'Terjadi kesalahan saat mengkonfirmasi pesanan.'], 500);
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
            
            $items = $cartData['items'] ?? [];
            $groupedCart = $this->cartService->groupCartItemsByStore($items);
            $grandTotal = $cartData['total'] ?? 0;
            $userBalance = $user['balance'] ?? 0;
            $sisaSaldo = $userBalance - $grandTotal;
            $this->render('pages/orders/checkout', [
                'groupedCart' => $groupedCart,
                'grandTotal'  => $grandTotal,
                'user'        => $user,
                'sisaSaldo'   => $sisaSaldo,
                'csrf_token'  => Auth::csrfToken(),
                
                'cssFiles' => [
                    '/css/pages/checkout.css',
                    'https://cdn.quilljs.com/1.3.6/quill.snow.css'
                ], 
                'jsFiles' => [
                    '/js/utils/fetchXhr.js',
                    '/js/components/confirm-modal.js', 
                    'https://cdn.quilljs.com/1.3.6/quill.js',
                    '/js/utils/quill-setup.js',
                    '/js/pages/orders/checkout.js'
                ]
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
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $access = FeatureFlagService::checkAccess(Auth::id(), 'checkout_enabled');

            if (!$access['allowed']) {
                http_response_code(503);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Checkout gagal: ' . $access['reason']
                ]);
                exit;
            }
        }
        
        $this->requireRole('BUYER');
        $this->verifyCsrf();
        
        try {
            $postData = $this->getPost();
            $shippingAddress = $postData['shipping_address'] ?? null;

            $postData['shipping_address_plain'] = $shippingAddress;

            $this->validate($postData, [
                'shipping_address_plain' => ['required', 'min:10']
            ]);

            $userId = Auth::user()['user_id'];
            $cart = $this->cartService->getCart($userId);
            
            if (empty($cart['items'])) {
                if ($this->isAjax()) {
                    return $this->json(['success' => false, 'message' => 'Keranjang belanja Anda kosong.'], 400);
                }
                $this->redirect('/cart?error=' . urlencode("Keranjang belanja Anda kosong."));
                return;
            }

            $orders = $this->buyerOrderService->createFromCart($userId, $shippingAddress);
            
            if ($orders) {
                $updatedUser = $this->authService->getUserById($userId);
                Auth::updateSession($updatedUser);
                
                $orderIds = array_column($orders, 'order_id');
                $_SESSION['last_checkout_order_ids'] = $orderIds;

                $redirectUrl = '/orders/success';
                $this->json(['success' => true, 'redirect' => $redirectUrl]);
                
                return;
            } else {
                throw new Exception('Gagal membuat order');
            }
            
        } catch (PDOException $e) {
            error_log("Checkout PDO Error: " . $e->getMessage());
            if ($this->isAjax()) return $this->json(['success' => false, 'message' => 'Database error.'], 500);
            $this->redirect('/cart?error=' . urlencode("Database error during checkout: " . $e->getMessage()));
        
        } catch (ValidationException $e) {
            error_log("Checkout Validation Error: " . $e->getMessage());
            $errorMessage = $e->getFirstError();
            if (str_contains($errorMessage, 'Shipping address plain')) {
                $errorMessage = 'Alamat pengiriman harus diisi (minimal 10 karakter).';
            }
            if ($this->isAjax()) return $this->json(['success' => false, 'message' => $errorMessage], 422);
            $this->redirect('/checkout?error=' . urlencode($errorMessage));
        
        } catch (Exception $e) {
            error_log("Checkout Error: " . $e->getMessage());
            if ($this->isAjax()) return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
            $this->redirect('/cart?error=' . urlencode("Unexpected error during checkout: " . $e->getMessage()));
        }
    }

    public function successCheckout() {
        $this->requireRole('BUYER');
        
        try {
            $orderIds = $_SESSION['last_checkout_order_ids'] ?? null;
            
            if (empty($orderIds)) {
                $this->redirect('/orders');
                return;
            }
            
            unset($_SESSION['last_checkout_order_ids']);
            
            $orders = [];
            $buyerId = Auth::id();
            foreach ($orderIds as $orderId) {
                $orderDetails = $this->orderRepository->getBuyerOrderDetails($orderId, $buyerId); 
                if ($orderDetails) {
                    $orders[] = $orderDetails;
                }
            }
            
            $this->render('pages/orders/success', [
                'orders' => $orders,
                'pageTitle' => 'Checkout Berhasil',
                'cssFiles' => ['/css/pages/seller/orders.css', '/css/pages/errors.css']
            ]);
            
        } catch (Exception $e) {
            error_log('Error di halaman order success: ' . $e->getMessage());
            $this->redirect('/orders');
        }
    }
}