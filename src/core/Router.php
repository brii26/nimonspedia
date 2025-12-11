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

        // Treat HEAD as GET
        if ($method === 'HEAD') {
            $method = 'GET';
        }
        
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

        $data = [
            'pageTitle' => '404 Not Found',
            'path' => $path,
            'method' => $method,
            'cssFiles' => ['/css/pages/errors.css'],
        ];

        try {
            $content = View::render('pages/errors/404', $data);
            echo View::render('components/layout', array_merge($data, ['content' => $content]));
        } catch (Exception $e) {
            error_log("404 rendering failed: " . $e->getMessage());
            if (!headers_sent()) {
                http_response_code(404);
            }
            echo "404 Not Found: " . htmlspecialchars($path, ENT_QUOTES, 'UTF-8');
        }
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