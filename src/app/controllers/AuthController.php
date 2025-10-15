<?php

class AuthController extends BaseController {
    private $authService;
    
    public function __construct() {
        parent::__construct();
        $this->authService = new AuthService();
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
            $this->verifyCsrf();
            
            $postData = $this->getPost();
            
            $this->authService->validateRegistrationData($postData);
            $user = $this->authService->register($postData);
            
            Auth::login($user);
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
            $this->verifyCsrf();
            
            $postData = $this->getPost();
            
            $this->authService->validateLoginData($postData);
            $user = $this->authService->login($postData['email'], $postData['password']);
            
            Auth::login($user);
            $this->redirect('/dashboard');
            
        } catch (ValidationException $e) {
            $this->render('pages/auth/login', [
                'errors' => $e->getErrors(),
                'old' => $this->getPost()
            ]);
        } catch (Exception $e) {
            $this->render('pages/auth/login', [
                'error' => $e->getMessage(),
                'old' => $this->getPost()
            ]);
        }
    }
    
    /**
     * Process logout
     */
    public function logout() {
        Auth::logout();
        $this->redirect('/login');
    }
    
    /**
     * Show profile form
     */
    public function profileForm() {
        $this->requireAuth();
        
        $user = Auth::user();
        $userDetails = $this->authService->getUserById($user['user_id']);
        
        $this->render('pages/auth/profile', ['user' => $userDetails]);
    }
    
    /**
     * Update profile
     */
    public function updateProfile() {
        $this->requireAuth();
        
        try {
            $this->verifyCsrf();
            
            $postData = $this->getPost();
            $userId = Auth::user()['user_id'];

            $updatedUser = $this->authService->updateProfile($userId, $postData);
            Auth::updateSession($updatedUser);
            
            $this->render('pages/auth/profile', [
                'success' => 'Profile updated successfully',
                'user' => $updatedUser
            ]);
            
        } catch (Exception $e) {
            $this->render('pages/auth/profile', [
                'error' => $e->getMessage(),
                'old' => $this->getPost(),
                'user' => $this->authService->getUserById(Auth::user()['user_id'])
            ]);
        }
    }
    
    /**
     * Change password
     */
    public function changePassword() {
        $this->requireAuth();
        
        try {
            $this->verifyCsrf();
            
            $postData = $this->getPost();
            $userId = Auth::user()['user_id'];
            
            $this->authService->changePassword(
                $userId,
                $postData['current_password'],
                $postData['new_password'],
                $postData['confirm_password']
            );
            
            $this->json(['success' => true, 'message' => 'Password changed successfully']);
            
        } catch (Exception $e) {
            $this->json(['success' => false, 'message' => $e->getMessage()]);
        }
    }
    
    /**
     * Top up balance
     */
    public function topUp() {
        $this->requireAuth();
        
        try {
            $this->verifyCsrf();
            
            $postData = $this->getPost();
            $userId = Auth::user()['user_id'];
            
            $newBalance = $this->authService->topUpBalance($userId, $postData['amount']);
            $_SESSION['balance'] = $newBalance;
            
            $this->json(['success' => true, 'new_balance' => $newBalance]);
            
        } catch (Exception $e) {
            $this->json(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}