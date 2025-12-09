<?php

/**
 * Handles business logic related to orders from a Buyer's perspective.
 */
class BuyerOrderService {
    
    /** @var OrderRepository */
    protected $orderRepo;
    
    /** @var CartService */
    protected $cartService;

    /** @var StoreService */
    protected $storeService;

    /**
     * @param OrderRepository $orderRepo Repository for order data
     * @param CartService $cartService Service for cart operations
     */
    public function __construct(OrderRepository $orderRepo, CartService $cartService) {
        $this->orderRepo = $orderRepo;
        $this->cartService = $cartService;
        $this->storeService = new StoreService();
    }

    /**
     * Get a paginated list of orders for a specific buyer.
     *
     * @param int $buyerId The ID of the buyer
     * @param int $page The current page number
     * @param int $perPage Number of items per page
     * @param string|null $status Filter by order status (e.g., 'completed', 'waiting_approval')
     * @return array Associative array with 'data' (orders) and 'total_pages'
     */
    public function getBuyerOrders(int $buyerId, int $page = 1, int $perPage = 10, ?string $status = null): array {
        $result = $this->orderRepo->getOrdersByBuyer($buyerId, $page, $perPage, $status);
        
        if (!empty($result['data'])) {
            foreach ($result['data'] as $key => $order) {
                $result['data'][$key]['items'] = $this->orderRepo->getOrderItems($order['order_id']);
            }
        }
        
        return $result;
    }

    /**
     * Get the full details for a single order,
     * verifying it belongs to the specified buyer.
     *
     * @param int $orderId The ID of the order to find
     * @param int $buyerId The ID of the buyer (for verification)
     * @return array|null The complete order details (with items) or null if not found
     */
    public function getBuyerOrderDetails(int $orderId, int $buyerId): ?array {
        $order = $this->orderRepo->getBuyerOrderDetails($orderId, $buyerId);
        
        if (!$order) {
            return null;
        }
        
        return $order;
    }

    /**
     * Process the checkout:
     * 1. Validates the cart and user.
     * 2. Calls the repository to perform the complex checkout transaction.
     * 3. Clears the cart if successful.
     * 4. Notifies sellers about new orders.
     *
     * @param int $buyerId The ID of the buyer checking out
     * @return array The first order that was created (for redirection)
     * @throws ValidationException If cart is empty, stock is insufficient, or balance is too low
     * @throws Exception If a system-level error occurs
     */
    public function createFromCart(int $buyerId, ?string $shippingAddress = null): ?array {
        $cart = $this->cartService->getCart($buyerId);
        $items = $cart['items'];
        $totalPrice = $cart['total'];
        if (empty($items)) {
            throw new ValidationException("Keranjang Anda kosong.");
        }
        $createdOrders = $this->orderRepo->processCheckout($buyerId, $items, $totalPrice, $shippingAddress);
        
        if (empty($createdOrders)) {
            throw new Exception("Gagal membuat pesanan karena kesalahan sistem.");
        }
        $this->cartService->clearCart($buyerId);
        $_SESSION['cart_count'] = 0;

        // Notify sellers about new orders (non-blocking)
        try {
            $buyer = Auth::user();
            $buyerName = $buyer['name'] ?? 'Pembeli';
            
            foreach ($createdOrders as $order) {
                if (isset($order['store_id']) && isset($order['order_id'])) {
                    $store = $this->storeService->getStoreById($order['store_id']);
                    if ($store && isset($store['user_id'])) {
                        NotificationService::notifyOrderWaitingApproval(
                            (int)$order['order_id'], 
                            (int)$store['user_id'], 
                            $buyerName
                        );
                    }
                }
            }
        } catch (Exception $e) {
            error_log('Notification error: ' . $e->getMessage());
        }

        return $createdOrders;
    }
}