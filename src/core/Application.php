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
            session_start();
        }
        
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
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
    
    // Tolong lengkapin cokkk
    private function setupRoutes() {
        $this->router->get('/', 'HomeController@index');
        
        // Auth routes (Track 1)
		$this->router->get('/login', 'AuthController@loginForm');
        $this->router->post('/login', 'AuthController@login');
		$this->router->get('/register', 'AuthController@registerForm');
        $this->router->post('/register', 'AuthController@register');
        $this->router->post('/logout', 'AuthController@logout');
        
        // Dashboard & profile (authenticated users)
        $this->router->get('/profile', 'AuthController@profileForm');
        $this->router->post('/profile', 'AuthController@updateProfile');
        $this->router->post('/profile/password', 'AuthController@changePassword');
        $this->router->post('/balance/topup', 'AuthController@topUp');
        
        // Product discovery routes (Track 2)
        $this->router->get('/products', 'ProductController@index');
        $this->router->get('/product', 'ProductController@show');

        $this->router->get('/store', 'StoreController@show');
        // $this->router->get('/stores/{id}', 'StoreController@show');
        
        // Cart routes (Track 2) 
        // Cart routes (Track 2)
        $this->router->get('/cart', 'CartController@index');
        $this->router->post('/cart/add', 'CartController@add');
        $this->router->post('/cart/update', 'CartController@update');
        $this->router->post('/cart/remove', 'CartController@remove');
        $this->router->get('/api/cart/count', 'CartController@count');
        
        // Order routes (Track 2 & 3)
        $this->router->get('/orders', 'BuyerOrdersController@index');
        $this->router->get('/checkout', 'BuyerOrdersController@showCheckoutPage'); 
        $this->router->post('/checkout', 'BuyerOrdersController@checkout');
        $this->router->get('/orders/show', 'BuyerOrdersController@show');
        
        // Seller routes (Track 3 - TODO)
        $this->router->get('/seller/products', 'SellerController@listProducts');
        $this->router->get('/seller/products/create', 'SellerController@createProductForm');
        $this->router->post('/seller/products/store', 'SellerController@storeProduct');
		$this->router->get('/seller/products/edit', 'SellerController@editProduct');
		$this->router->post('/seller/products/update', 'SellerController@updateProduct');
		$this->router->post('/seller/products/delete', 'SellerController@deleteProduct');
    		// Seller Orders Management
		$this->router->get('/seller/orders', 'SellerOrdersController@index');
		$this->router->get('/seller/orders/show', 'SellerOrdersController@showOrder');
		$this->router->post('/seller/orders/approve', 'SellerOrdersController@approve');
		$this->router->post('/seller/orders/reject', 'SellerOrdersController@reject');
		$this->router->post('/seller/orders/delivery', 'SellerOrdersController@setDelivery');
		$this->router->post('/seller/store/update', 'SellerController@updateStore');
        
        // API routes for AJAX (TODO)
        // $this->router->get('/api/cart/count', 'CartController@count');
        // $this->router->post('/api/cart/update', 'CartController@updateQuantity');
        // $this->router->get('/api/balance/check', 'AuthController@checkBalance');
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