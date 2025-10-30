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
            $this->redirect('/dashboard');
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
            $this->redirect('/dashboard');
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

			$rules['store_name'] = (isset($postData['role']) && $postData['role'] === 'SELLER')
				? ['required', 'max:100']
				: ['max:100'];

			$this->validate($postData, $rules);
			$user = $this->authService->register($postData);

            Auth::login($user);
            $this->redirect('/dashboard');
            
        } catch (ValidationException $e) {
            $this->render('pages/auth/register', [
                'errors' => $e->getErrors(),
                'old' => $this->getPost(),
                'pageTitle' => 'Register',
                'cssFiles' => ['/css/pages/auth.css'],
                'jsFiles' => ['/js/components/password-toggle.js', '/js/pages/auth/register.js']
            ]);
        } catch (Exception $e) {
            $this->render('pages/auth/register', [
                'error' => $e->getMessage(),
                'old' => $this->getPost(),
                'pageTitle' => 'Register',
                'cssFiles' => ['/css/pages/auth.css'],
                'jsFiles' => ['/js/components/password-toggle.js', '/js/pages/auth/register.js']
            ]);
        }
    }

    // Role select form 
    public function roleSelectForm() { 
        if (Auth::check()) { 
            $this->redirect('/dashboard'); 
        } 
        $this->render('pages/auth/role_select'); 
    } 

    // Role select handler 
    public function roleSelect() { 
        if (Auth::check()) { 
            $this->redirect('/dashboard'); 
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
     * Show dashboard
     */
    public function dashboard() {
        $this->requireAuth();
        $user = Auth::user();
        $view = ($user['role'] === 'SELLER') ? 'pages/dashboard/seller' : 'pages/dashboard/buyer';
        $data = ['user' => $user];

        if ($user['role'] === 'SELLER') {
            $store = $this->storeService->getStoreForUser($user['user_id']);
            if ($store && isset($store['store_id'])) {
                $storeId = (int)$store['store_id'];
                $data['stats'] = $this->statsService->getSellerStats($storeId);
                $data['store'] = $store ?: ['store_name' => '', 'store_description' => ''];
            } else {
                $data['stats'] = [
                    'total_products' => 0,
                    'total_orders' => 0,
                    'revenue' => 0,
                    'low_stocks' => 0
                ];
            }
        }

		$jsFiles = null;
		$cssFiles = null;

		if($user['role'] === 'SELLER') {
			$jsFiles = [
				'/js/pages/dashboard/seller.js',
				'https://cdn.quilljs.com/1.3.6/quill.js',
				'/js/utils/quill-setup.js',
				'js/utils/fetchXhr.js'
			];
			$cssFiles = [
				'css/pages/dashboard.css',
				'https://cdn.quilljs.com/1.3.6/quill.snow.css',
				'css/pages/seller/store.css'
			];
		} else {
			$jsFiles = ['/js/pages/dashboard/buyer.js'];
			$cssFiles = [
				'css/pages/dashboard.css'
			];
		}
		$this->render($view, array_merge($data, [
			'user' => $user,
			'pageTitle' => 'Dashboard',
			'cssFiles' => $cssFiles,
			'jsFiles' => $jsFiles
		]));
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
                'old' => $this->getPost(),
                'pageTitle' => 'Login',
                'cssFiles' => ['/css/pages/auth.css'],
                'jsFiles' => ['/js/components/password-toggle.js', '/js/pages/auth/login.js']
            ]);
        } catch (Exception $e) {
            $this->render('pages/auth/login', [
                'errors' => $e->getErrors(),
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
                // Handle CSRF error, maybe log it or show a message
                // For simplicity, just redirecting
                error_log("Logout CSRF failed: " . $e->getMessage());
             }
        } else {
            // Allow GET logout too for simplicity, though POST is safer
            Auth::logout();
        }
        $this->redirect('/login');
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
            'cssFiles' => ['/css/pages/profile.css'], // CSS profile
            'jsFiles' => [ // JS profile
                '/js/components/password-toggle.js',
                '/js/pages/auth/profile.js'
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