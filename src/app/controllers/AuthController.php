<?php

class AuthController extends BaseController {
    
    /**
     * Show login form
     */
    public function loginForm() {
        // Redirect if already logged in
        if (Auth::check()) {
            $this->redirect('/dashboard');
        }
        
        $this->render('pages/auth/login');
    }
    
    /**
     * Show registration form
     */
    public function registerForm() {
        if (Auth::check()) {
            $this->redirect('/dashboard');
        }
        
        echo "<h1>Register Page</h1>";
        echo "<p>This is a test register page - AuthController is working!</p>";
        echo "<p><a href='/login'>Go to Login</a></p>";
    }
    
    /**
     * Show dashboard (requires auth)
     */
    public function dashboard() {
        $this->requireAuth();
        
        $user = Auth::user();
        
        // Redirect to appropriate dashboard based on role
        if ($user['role'] === 'SELLER') {
            $this->render('pages/dashboard/seller', ['user' => $user]);
        } else {
            $this->render('pages/dashboard/buyer', ['user' => $user]);
        }
    }
    
    /**
     * Process login
     */
    public function login() {
        try {
            // For testing, create a mock login
            // TODO: Implement proper login with UserRepository
            
            // Mock user for testing Track 2 & 3
            $mockUser = [
                'user_id' => 1,
                'name' => 'Test User',
                'email' => 'test@example.com',
                'role' => $_POST['role'] ?? 'BUYER', // Allow role selection for testing
                'balance' => 100000
            ];
            
            Auth::login($mockUser);
            $this->redirect('/dashboard');
            
        } catch (Exception $e) {
            $this->render('pages/auth/login', [
                'error' => $e->getMessage(),
                'old' => $_POST
            ]);
        }
    }
    
    /**
     * Process logout
     */
    public function logout() {
        Auth::logout();
        echo "<h1>Logged Out</h1>";
        echo "<p>You have been logged out successfully.</p>";
        echo "<p><a href='/login'>Login Again</a></p>";
    }
    
    /**
     * Show profile
     */
    public function profileForm() {
        $this->requireAuth();
        
        echo "<h1>Profile Page</h1>";
        echo "<p>This will show user profile form.</p>";
        echo "<p><a href='/dashboard'>Back to Dashboard</a></p>";
    }
}