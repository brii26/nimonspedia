<?php

class AuthController extends BaseController {
    private $userRepository;
    
    public function __construct() {
        parent::__construct();
        $this->userRepository = new UserRepository();
    }
    
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
        
        $this->render('pages/auth/register');
    }
    
    /**
     * Process registration
     */
    public function register() {
        try {
            // Verify CSRF token
            $this->verifyCsrf();
            
            // Validate input
            $this->validate($this->getPost(), [
                'name' => ['required', 'min:2', 'max:100'],
                'email' => ['required', 'email'],
                'password' => ['required', 'min:6'],
                'password_confirmation' => 'required',
                'role' => ['required', 'in:BUYER,SELLER'],
                'address' => ['required', 'min:10']
            ]);
            
            $postData = $this->getPost();
            
            // Check password confirmation
            if ($postData['password'] !== $postData['password_confirmation']) {
                throw new Exception('Password confirmation does not match');
            }
            
            // Check if email already exists
            if ($this->userRepository->emailExists($postData['email'])) {
                throw new Exception('Email already registered');
            }
            
            // Create user
            $userData = [
                'name' => $postData['name'],
                'email' => $postData['email'],
                'password' => $postData['password'], // Will be hashed in repository
                'role' => $postData['role'],
                'address' => $postData['address']
            ];
            
            $userId = $this->userRepository->createUser($userData);
            
            if (!$userId) {
                throw new Exception('Failed to create account');
            }
            
            // Get created user and login
            $user = $this->userRepository->find($userId);
            Auth::login($user);
            
            // Redirect based on role
            $this->redirect('/dashboard');
            
        } catch (ValidationException $e) {
            $this->render('pages/auth/register', [
                'errors' => $e->getErrors(),
                'old' => $this->getPost()
            ]);
        } catch (Exception $e) {
            $this->render('pages/auth/register', [
                'error' => $e->getMessage(),
                'old' => $this->getPost()
            ]);
        }
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