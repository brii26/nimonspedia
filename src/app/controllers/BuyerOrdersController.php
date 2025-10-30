<?php

class BuyerOrdersController extends BaseController {
    private $orderService;
    private $cartService;
    private $orderRepository;
    
    public function __construct() {
        parent::__construct();
        $this->requireAuth(); 
        $this->orderRepository = new OrderRepository();
        $this->cartService = new CartService(new ProductRepository(), new CartItemRepository());
        $this->orderService = new BuyerOrderService(
            $this->orderRepository,
            $this->cartService
        );
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
            
            $orders = $this->orderService->getBuyerOrders(
                Auth::user()['user_id'],
                $page,
                $perPage,
                $status
            );
            
            $this->render('pages/orders/index', [
                'orders' => $orders['data'],
                'current_page' => $page,
                'total_pages' => $orders['total_pages'],
                'status_filter' => $status
            ]);
            
        } catch (Exception $e) {
            error_log('Error fetching orders: ' . $e->getMessage());
            $this->render('pages/orders/index', [
                'orders' => [],
                'error' => 'Failed to load orders'
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
            
            $order = $this->orderService->getOrderDetails($orderId, Auth::user()['user_id']);
            if (!$order) {
                $this->redirect('/orders');
                return;
            }
            
            $this->render('pages/orders/show', [
                'order' => $order
            ]);
            
        } catch (Exception $e) {
            error_log('Error showing order: ' . $e->getMessage());
            $this->redirect('/orders');
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
                'user' => $user
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
            $order = $this->orderService->createFromCart(Auth::user()['user_id']);
            
            if ($order) {
                $this->redirect('/order/detail?id=' . $order['order_id']);
            } else {
                throw new Exception('Failed to create order');
            }
            
        } catch (ValidationException $e) {
            $this->redirect('/cart?error=' . urlencode($e->getFirstError()));
        } catch (Exception $e) {
            error_log('Checkout error: ' . $e->getMessage());
            $this->redirect('/cart?error=' . urlencode('Checkout failed. Please try again.'));
        }
    }
}