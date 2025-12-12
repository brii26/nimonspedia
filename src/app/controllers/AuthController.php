<?php

class AuthController extends BaseController {
    private $authService;
    private $storeService;
    private $statsService;

    public function __construct() {
        parent::__construct();
        $this->authService = new AuthService();
        $this->storeService = new StoreService();
        $this->statsService = new StatsService();
    }
    
    /**
     * Show login form
     */
    public function loginForm() {
        if (Auth::check()) {
            $this->redirect('/');
        }
        $this->render('pages/auth/login', [
            'pageTitle' => 'Login',
            'cssFiles' => ['/css/pages/auth.css'],
            'jsFiles' => ['/js/components/password-toggle.js', '/js/pages/auth/login.js']
        ]);
    }
    
    /**
     * Show registration form
     */
    public function registerForm() {
        if (Auth::check()) {
            $this->redirect('/');
        }
        $this->render('pages/auth/register', [
            'pageTitle' => 'Register',
            'cssFiles' => ['/css/pages/auth.css', 'https://cdn.quilljs.com/1.3.6/quill.snow.css'],
            'jsFiles' => [
                '/js/components/password-toggle.js', 
                '/js/pages/auth/register.js',
                'https://cdn.quilljs.com/1.3.6/quill.js',
                '/js/utils/quill-setup.js',
            ],
        ]);
    }
    
    /**
     * Process registration
     */
    public function register() {
        try {
            $this->verifyCsrf();
            $postData = $this->getPost();

			$rules = [
				'name' => ['required', 'min:2', 'max:100'],
				'email' => ['required', 'email'],
				'password' => [
					'required',
					'min:8',
					'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*(_|[^\w])).+$/'
				],
				'password_confirmation' => ['required'],
				'role' => ['required', 'in:BUYER,SELLER'],
				'address' => ['required', 'min:10'],
			];

            if (isset($_FILES['store_logo'])) {
                $postData['store_logo'] = $_FILES['store_logo'];
            }

			$rules['store_name'] = (isset($postData['role']) && $postData['role'] === 'SELLER')
				? ['required', 'max:100']
				: ['max:100'];

            if (isset($postData['role']) && $postData['role'] === 'SELLER') {
				$rules['store_name'] = ['required', 'max:100'];
				$rules['store_logo'] = ['size:2097152', 'mimes:jpeg,png,jpg,webp'];
			} else {
				$rules['store_name'] = ['max:100'];
                $rules['store_logo'] = []; // Tidak perlu validasi jika bukan seller
            }

			$this->validate($postData, $rules);
			$user = $this->authService->register($postData);

            Auth::login($user);
            $this->redirect('/');
            
        } catch (ValidationException $e) {
            $this->render('pages/auth/register', [
                'errors' => $e->getErrors(),
                'old' => $this->getPost(),
                'pageTitle' => 'Register',
                'cssFiles' => ['/css/pages/auth.css',  'https://cdn.quilljs.com/1.3.6/quill.snow.css'],
                'jsFiles' => [
                    '/js/components/password-toggle.js',
                    'https://cdn.quilljs.com/1.3.6/quill.js',
                    '/js/utils/quill-setup.js',
                    '/js/pages/auth/register.js']
            ]);
        } catch (Exception $e) {
            $errorMessage = $e->getMessage();
            
            if (($e instanceof PDOException || $e->getCode() == '23505') && str_contains($e->getMessage(), 'SQLSTATE[23505]')) {
                
                if (str_contains($e->getMessage(), 'users_email_key')) {
                    $errorMessage = 'Email already registered.';
                } else if (str_contains($e->getMessage(), 'stores_store_name_key')) {
                    $errorMessage = 'Store name is already taken.';
                } else {
                    $errorMessage = 'A unique value conflict occurred. Please check your inputs.';
                }
            } 
            else if ($errorMessage === 'Email already registered' || $errorMessage === 'Store name is already taken') {
            }
            else {
                error_log("Register error: " . $e->getMessage());
                $errorMessage = 'An unexpected error occurred. Please try again.';
            }

            $this->render('pages/auth/register', [
                'error' => $errorMessage,
                'old' => $this->getPost(),
                'pageTitle' => 'Register',
                'cssFiles' => ['/css/pages/auth.css',  'https://cdn.quilljs.com/1.3.6/quill.snow.css'],
                'jsFiles' => [
                    '/js/components/password-toggle.js',
                    'https://cdn.quilljs.com/1.3.6/quill.js',
                    '/js/utils/quill-setup.js',
                    '/js/pages/auth/register.js'
                    ]
            ]);
        }
    }

    // Role select form 
    public function roleSelectForm() { 
        if (Auth::check()) { 
            $this->redirect('/'); 
        } 
        $this->render('pages/auth/role_select'); 
    } 

    // Role select handler 
    public function roleSelect() { 
        if (Auth::check()) { 
            $this->redirect('/'); 
        } 
        try { 
            $this->verifyCsrf(); 
            $role = $this->getPost('role'); 
            if ($role !== 'BUYER' && $role !== 'SELLER') { 
                throw new Exception('Invalid role'); 
            } 
            $this->redirect('/register?role=' . urlencode($role)); 
        } catch (Exception $e) { 
            $this->render('pages/auth/role_select', ['error' => $e->getMessage()]); 
        } 
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
            $this->redirect('/');
            
        } catch (ValidationException $e) {
            $this->render('pages/auth/login', [
                'errors' => $e->getErrors(),
                'old' => $this->getPost(),
                'pageTitle' => 'Login',
                'cssFiles' => ['/css/pages/auth.css'],
                'jsFiles' => ['/js/components/password-toggle.js', '/js/pages/auth/login.js']
            ]);
        } catch (Exception $e) {
            $this->render('pages/auth/login', [
                'error' => $e->getMessage(),
                'old' => $this->getPost(),
                'pageTitle' => 'Login',
                'cssFiles' => ['/css/pages/auth.css'],
                'jsFiles' => ['/js/components/password-toggle.js', '/js/pages/auth/login.js']
            ]);
        }
    }
    
    /**
     * Process logout
     */
    public function logout() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            try {
                $this->verifyCsrf();
                Auth::logout();
            } catch (Exception $e) {
                error_log("Logout CSRF failed: " . $e->getMessage());
             }
        } else {
            Auth::logout();
        }
        $this->redirect('/');
    }
    
    /**
     * Show profile form
     */
    public function profileForm() {
        $this->requireAuth();
        $user = $this->authService->getUserById(Auth::id());
        $this->render('pages/auth/profile', [
            'user' => $user,
            'pageTitle' => 'Profile Settings',
            'cssFiles' => ['/css/pages/profile.css'],
            'jsFiles' => [
                '/js/components/password-toggle.js',
                '/js/pages/auth/profile.js',
                '/js/utils/fetchXhr.js',
                '/js/utils/notifications.js'
            ]
        ]);
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
            
            $this->json([
                'success' => true, 
                'message' => 'Profile updated successfully!',
                'user' => [
                    'name' => $updatedUser['name'],
                    'email' => $updatedUser['email'],
                    'address' => $updatedUser['address']
                ]
            ]);

        } catch (ValidationException $e) {
            $this->json(['success' => false, 'errors' => $e->getErrors()], 422);

        } catch (Exception $e) {
            $this->json(['success' => false, 'message' => $e->getMessage()], 400);
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
                'new_password' => [
					'required',
					'min:8',
					'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*(_|[^\w])).+$/'
				],
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

    /**
     * Get Session Metadata (CSRF, Auth Status, Feature Flags)
     * Used by client-side scripts to hydrate UI state.
     */
    public function sessionMeta() {
        require_once __DIR__ . '/../services/FeatureFlagService.php';
        
        // Ensure session is active to get CSRF token
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $userId = Auth::id();
        $checkoutAccess = FeatureFlagService::checkAccess($userId, 'checkout_enabled');
        $chatAccess = FeatureFlagService::checkAccess($userId, 'chat_enabled');
        $auctionAccess = FeatureFlagService::checkAccess($userId, 'auction_enabled');


        $this->json([
            'is_logged_in' => Auth::check(),
            'user_role' => $_SESSION['role'] ?? null,
            'checkout_enabled' => $checkoutAccess['allowed'],
            'chat_enabled' => $chatAccess['allowed'],
            'auction_enabled' => $auctionAccess['allowed'],
            'csrf_token' => Auth::csrfToken()
        ]);
    }
}