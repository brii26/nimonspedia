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
    }
    
    private function setupAutoloader() {
        // Autoloader untuk semua class
        spl_autoload_register(function ($class_name) {
            $directories = [
                __DIR__ . '/',                          // core/
                __DIR__ . '/../app/controllers/',       // controllers/
                __DIR__ . '/../app/models/',            // models/
            ];
            
            foreach ($directories as $directory) {
                $file = $directory . $class_name . '.php';
                if (file_exists($file)) {
                    require_once $file;
                    return;
                }
            }
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
        
        // Dashboard & profile (authenticated users)
        $this->router->get('/dashboard', 'AuthController@dashboard');
        $this->router->get('/profile', 'AuthController@profileForm');
        $this->router->post('/profile', 'AuthController@updateProfile');
        $this->router->post('/profile/password', 'AuthController@changePassword');
        $this->router->post('/balance/topup', 'AuthController@topup');
        
        // Product discovery routes
        $this->router->get('/products', 'ProductController@index');
        $this->router->get('/products/{id}', 'ProductController@show');
        $this->router->get('/stores/{id}', 'StoreController@show');
        
        // Cart routes
        $this->router->get('/cart', 'CartController@index');
        $this->router->post('/cart/add', 'CartController@add');
        $this->router->post('/cart/update', 'CartController@update');
        $this->router->post('/cart/remove', 'CartController@remove');
        
        // Order routes
        $this->router->get('/orders', 'OrderController@index');
        $this->router->post('/checkout', 'OrderController@checkout');
        
        // Seller routes
        $this->router->get('/seller/products', 'SellerController@products');
        $this->router->get('/seller/products/add', 'SellerController@addProductForm');
        $this->router->post('/seller/products', 'SellerController@storeProduct');
        $this->router->get('/seller/orders', 'SellerController@orders');
        
        // API routes for AJAX
        $this->router->post('/api/cart/update', 'CartController@updateQuantity');
        $this->router->post('/api/balance/check', 'AuthController@checkBalance');
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