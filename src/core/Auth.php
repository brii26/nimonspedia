<?php

class Auth {
    /**
     * Login user and create session
     */
    public static function login($user) {
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['name'] = $user['name'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['balance'] = $user['balance'] ?? 0;
        $_SESSION['login_time'] = time();
        
        // Regenerate session ID for security
        session_regenerate_id(true);
    }
    
    /**
     * Logout user and destroy session
     */
    public static function logout() {
        session_destroy();
    }
    
    /**
     * Check if user is logged in
     */
    public static function check() {
        return isset($_SESSION['user_id']);
    }
    
    /**
     * Get current user data
     */
    public static function user() {
        if (!self::check()) return null;
        
        return [
            'user_id' => $_SESSION['user_id'],
            'role' => $_SESSION['role'],
            'name' => $_SESSION['name'],
            'email' => $_SESSION['email'],
            'balance' => $_SESSION['balance'] ?? 0
        ];
    }
    
    /**
     * Get current user ID
     */
    public static function id() {
        return self::check() ? $_SESSION['user_id'] : null;
    }
    
    /**
     * Require authentication - redirect to login if not authenticated
     */
    public static function requireAuth() {
        if (!self::check()) {
            header('Location: /login');
            exit;
        }
    }
    
    /**
     * Require specific role
     */
    public static function requireRole($role) {
        self::requireAuth();
        if ($_SESSION['role'] !== $role) {
            http_response_code(403);
            die('Access denied: Insufficient permissions');
        }
    }
    
    /**
     * Check if current user is buyer
     */
    public static function isBuyer() {
        return self::check() && $_SESSION['role'] === 'BUYER';
    }
    
    /**
     * Check if current user is seller
     */
    public static function isSeller() {
        return self::check() && $_SESSION['role'] === 'SELLER';
    }
    
    /**
     * Check if user is guest (not logged in)
     */
    public static function isGuest() {
        return !self::check();
    }
    
    /**
     * Generate CSRF token for forms
     */
    public static function csrfToken() {
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
    
    /**
     * Verify CSRF token
     */
    public static function verifyCsrf($token) {
        return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
    }
}