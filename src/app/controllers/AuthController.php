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

            $this->validate($postData, [
                'name' => ['required', 'min:2', 'max:100'],
                'email' => ['required', 'email'],
                'password' => ['required', 'min:8', 
                    'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)'
                    .'(?=.*(_|[^\w])).+$/'
                    .'`Password must contain uppercase, lowercase, number, and symbol'
                ],
                'password_confirmation' => 'required',
                'role' => ['required', 'in:BUYER,SELLER'],
                'address' => ['required', 'min:10']
            ]);
            
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
     * Show dashboard
     */
    public function dashboard() {
        $this->requireAuth();
        $user = Auth::user();
        $view = ($user['role'] === 'SELLER') ? 'pages/dashboard/seller' : 'pages/dashboard/buyer';
        $this->render($view, ['user' => $user]);
    }
    
    /**
     * Process login
     */
    public function login() {
        try {
            $this->verifyCsrf();
            $postData = $this->getPost();
            
            $this->validate($postData, [
                'email' => ['required', 'email'],
                'password' => 'required'
            ]);
            
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
        $user = $this->authService->getUserById(Auth::id());
        $this->render('pages/auth/profile', ['user' => $user]);
    }
    
    /**
     * Update profile
     */
    public function updateProfile() {
        $this->requireAuth();
        
        try {
            $this->verifyCsrf();
            $postData = $this->getPost();
            
            $this->validate($postData, [
                'name' => ['required', 'min:2', 'max:100'],
                'email' => ['required', 'email'],
                'address' => ['required', 'min:10']
            ]);

            $updatedUser = $this->authService->updateProfile(Auth::id(), $postData);
            Auth::updateSession($updatedUser);
            
            $this->render('pages/auth/profile', [
                'success' => 'Profile updated successfully',
                'user' => $updatedUser
            ]);
            
        } catch (Exception $e) {
            $this->render('pages/auth/profile', [
                'error' => $e->getMessage(),
                'user' => $this->authService->getUserById(Auth::id())
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
            
            $this->validate($postData, [
                'current_password' => 'required',
                'new_password' => ['required', 'min:6'],
                'confirm_password' => 'required'
            ]);
            
            $this->authService->changePassword(
                Auth::id(),
                $postData['current_password'],
                $postData['new_password'],
                $postData['confirm_password']
            );
            
            $this->json(['success' => true, 'message' => 'Password changed successfully']);
            
        } catch (Exception $e) {
            $this->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
    
    /**
     * Top up balance
     */
    public function topUp() {
        $this->requireAuth();
        $this->requireRole('BUYER');
        
        try {
            $this->verifyCsrf();
            $postData = $this->getPost();
            
            $this->validate($postData, [
                'amount' => ['required', 'numeric']
            ]);
            
            $updatedUser = $this->authService->topUpBalance(Auth::id(), $postData['amount']);
            Auth::updateSession($updatedUser);
            
            $this->json(['success' => true, 'new_balance' => $updatedUser['balance']]);
            
        } catch (Exception $e) {
            $this->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
}