<?php

class Router {
    private $routes = [];
    
    public function get($path, $handler) {
        $this->routes['GET'][$path] = $handler;
    }
    
    public function post($path, $handler) {
        $this->routes['POST'][$path] = $handler;
    }
    
    public function dispatch() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        error_log("Router: {$method} {$path}");
        
        if (isset($this->routes[$method][$path])) {
            $handler = $this->routes[$method][$path];
            try {
                $this->callHandler($handler);
            } catch (Exception $e) {
                $this->handleError($e);
            }
        } else {
            $this->handle404($method, $path);
        }
    }
    
    private function callHandler($handler) {
        list($controller, $method) = explode('@', $handler);
        
        if (!class_exists($controller)) {
            throw new Exception("Controller '{$controller}' not found");
        }
        
        $controllerInstance = new $controller();
        
        if (!method_exists($controllerInstance, $method)) {
            throw new Exception("Method '{$method}' not found in controller '{$controller}'");
        }
        
        $controllerInstance->$method();
    }
    
    private function handle404($method, $path) {
        http_response_code(404);
        
        // Better 404 page
        echo "The page {$path} could not be found. Method: {$method}";
    }
    
    private function handleError($exception) {
        http_response_code(500);
        error_log("Router Error: " . $exception->getMessage());
        
        echo "Error:" . htmlspecialchars($exception->getMessage()) . "
        File: " . htmlspecialchars($exception->getFile()) . "
        Line: " . $exception->getLine();
    }
    
    // Helper method untuk debug
    public function getRoutes() {
        return $this->routes;
    }
}