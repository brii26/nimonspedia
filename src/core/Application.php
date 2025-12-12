<?php

class Application {
    private $router;
    private $db;
    
    public function __construct() {
        $this->initializeSession();
        $this->setupAutoloader();
        $this->initializeDatabase();
        $this->setupRouter();
        $this->setupRoutes();
    }
    
    private function initializeSession() {
        if (session_status() === PHP_SESSION_NONE) {
            // Fix Redis connection from ENV for session handler
            $redisHost = getenv('REDIS_HOST') ?: 'redis';
            $redisPort = getenv('REDIS_PORT') ?: '6379';
            ini_set('session.save_path', "tcp://$redisHost:$redisPort");

            // Lazy Session Logic:
            // Don't start session for public API calls if no session cookie exists.
            // This allows Nginx to cache the response.
            $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
            $isPublicApi = ($path === '/products');
            $hasSessionCookie = isset($_COOKIE[session_name()]);

            if (!$isPublicApi || $hasSessionCookie) {
                session_start();
            }
        }
    }
    
    private function setupAutoloader() {
        // Autoloader untuk semua class
        spl_autoload_register(function ($class_name) {
            $directories = [
                __DIR__ . '/',
                __DIR__ . '/../app/controllers/',
                __DIR__ . '/../app/models/',
                __DIR__ . '/../app/repository/',
                __DIR__ . '/../app/services/',
                __DIR__ . '/../lib/',
            ];
            
            foreach ($directories as $directory) {
                $file = $directory . $class_name . '.php';
                if (file_exists($directory) && file_exists($file)) {
                    require_once $file;
                    return;
                }
            }
            
            error_log("Class not found: {$class_name}");
        });
    }
    
    private function initializeDatabase() {
        try {
            $this->db = Database::getInstance();
        } catch (Exception $e) {
            $this->handleDatabaseError($e);
        }
    }
    
    private function setupRouter() {
        $this->router = new Router();
    }
    
    private function setupRoutes() {
        $this->router->get('/', 'HomeController@index');
        
        // Auth routes
		$this->router->get('/login', 'AuthController@loginForm');
        $this->router->post('/login', 'AuthController@login');
		$this->router->get('/register', 'AuthController@registerForm');
        $this->router->post('/register', 'AuthController@register');
        $this->router->post('/logout', 'AuthController@logout');
        
        // Dashboard & profile
        $this->router->get('/profile', 'AuthController@profileForm');
        $this->router->post('/profile', 'AuthController@updateProfile');
        $this->router->post('/profile/password', 'AuthController@changePassword');
        $this->router->post('/balance/topup', 'AuthController@topUp');
        $this->router->get('/api/session-meta', 'AuthController@sessionMeta'); // New Endpoint
        
        // Product discovery routes
        $this->router->get('/products', 'ProductController@index');
        $this->router->get('/product', 'ProductController@show');

        $this->router->get('/api/stores', 'StoreController@api'); // API endpoint untuk stores list
        $this->router->get('/store', 'StoreController@show');
        
        // Cart routes 
        $this->router->get('/cart', 'CartController@index');
        $this->router->post('/cart/add', 'CartController@add');
        $this->router->post('/cart/update', 'CartController@update');
        $this->router->post('/cart/remove', 'CartController@remove');
        $this->router->get('/api/cart/count', 'CartController@count');
        
        // Chat API routes
        $this->router->post('/api/chat/initiate', 'ChatController@initiate');
        $this->router->get('/api/chat/rooms', 'ChatController@getRooms');
        
        // Order routes
        $this->router->get('/orders', 'BuyerOrdersController@index');
        $this->router->get('/checkout', 'BuyerOrdersController@showCheckoutPage'); 
        $this->router->post('/orders/checkout', 'BuyerOrdersController@checkout');
        $this->router->get('/orders/show', 'BuyerOrdersController@show');
        $this->router->post('/orders/confirm', 'BuyerOrdersController@confirmReceived');
        $this->router->get('/orders/success', 'BuyerOrdersController@successCheckout');
		$this->router->post('/orders/confirm-received', 'BuyerOrdersController@confirmReceived');
        
        // Review routes
        $this->router->get('/reviews/can-review', 'ReviewController@canReview');
        $this->router->get('/reviews/get', 'ReviewController@get');
        $this->router->post('/reviews/submit', 'ReviewController@submit');
        $this->router->post('/reviews/update', 'ReviewController@update');
        $this->router->post('/reviews/delete', 'ReviewController@delete');
        $this->router->post('/reviews/add-images', 'ReviewController@addImages');
        $this->router->post('/reviews/delete-image', 'ReviewController@deleteImage');
        $this->router->get('/reviews/product', 'ReviewController@getProductReviews');
        $this->router->get('/reviews/product-stats', 'ReviewController@getProductStats');
        $this->router->get('/reviews/my-reviews', 'ReviewController@myReviews');
        $this->router->get('/reviews/create', 'ReviewController@create');
        $this->router->get('/reviews/edit', 'ReviewController@edit');
        
        // Seller routes
        $this->router->get('/seller/products', 'SellerController@listProducts');
		$this->router->post('/seller/products/filter', 'SellerController@filter');
        $this->router->get('/seller/products/create', 'SellerController@createProductForm');
        $this->router->post('/seller/products/store', 'SellerController@storeProduct');
		$this->router->get('/seller/products/store', 'SellerController@storeProduct');
		$this->router->get('/seller/products/edit', 'SellerController@editProduct');
		$this->router->get('/seller/products/update', 'SellerController@updateProduct');
		$this->router->post('/seller/products/update', 'SellerController@updateProduct');
		$this->router->post('/seller/products/delete', 'SellerController@deleteProduct');

    	// Seller Orders Management
		$this->router->get('/seller/orders', 'SellerOrdersController@index');
		$this->router->get('/seller/orders/show', 'SellerOrdersController@showOrder');
		$this->router->post('/seller/orders/approve', 'SellerOrdersController@approve');
		$this->router->post('/seller/orders/reject', 'SellerOrdersController@reject');
		$this->router->post('/seller/orders/delivery', 'SellerOrdersController@setDelivery');
		$this->router->post('/seller/store/update', 'SellerController@updateStore');

		// Seller Reviews Management
		$this->router->get('/seller/reviews', 'SellerReviewController@index');
		$this->router->get('/seller/reviews/respond', 'SellerReviewController@respond');
		$this->router->post('/seller/reviews/respond', 'SellerReviewController@submitResponse');
		$this->router->get('/seller/reviews/edit-response', 'SellerReviewController@editResponse');
		$this->router->post('/seller/reviews/update-response', 'SellerReviewController@updateResponse');
		$this->router->post('/seller/reviews/delete-response', 'SellerReviewController@deleteResponse');

        $this->router->get('/seller/reports/sales', 'ReportController@exportSales');

        // Auction routes
		$this->router->post('/seller/auctions/create', 'AuctionController@create'); 
        $this->router->get('/seller/auctions/list', 'AuctionController@list');
		$this->router->post('/seller/auctions/cancel', 'AuctionController@cancel'); 
        
    }
    
    public function run() {
        try {
            $this->router->dispatch();
        } catch (Exception $e) {
            $this->handleApplicationError($e);
        }
    }
    
    private function handleDatabaseError($exception) {
        error_log("Database initialization failed: " . $exception->getMessage());
        
        http_response_code(503);
        echo "503";
        exit;
    }
    
    private function handleApplicationError($exception) {
        error_log("Application error: " . $exception->getMessage());
        
        http_response_code(500);
        echo "500";
    }
    
    public function getRegisteredRoutes() {
        return $this->router->getRoutes();
    }
}