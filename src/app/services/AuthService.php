<?php

require_once __DIR__ . '/../services/FileService.php';

class AuthService {
    private $userRepository;
	private $storeRepository;
    
    public function __construct() {
        $this->userRepository = new UserRepository();
		$this->storeRepository = new StoreRepository();
    }
    
    /**
     * Register new user
     */
    public function register($data) {
        if ($data['password'] !== $data['password_confirmation']) {
            throw new Exception('Password confirmation does not match');
        } 
        
        if ($this->userRepository->emailExists($data['email'])) {
            throw new Exception('Email already registered');
        }

		$userContextData = [
			'user' => null,
			'store' => null
		];
        
        $userData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'],
            'address' => $data['address']
        ];

        $userId = $this->userRepository->createUser($userData);
		$userData = $this->userRepository->find($userId);

		if ($data['role'] === 'SELLER') {
			$storeData =[
				'user_id' => $userId,
				'store_name' => $data['store_name'],
				'store_description' => $data['store_description'],
				'store_logo_path' => FileService::saveUploadedImage($_FILES['store_logo_path'], 'store_logo')
			];
			$storeId = $this->storeRepository->createStore($storeData);
			$storeData = $this->storeRepository->find($storeId);
			$userContextData['store'] = $storeData;
		}

		$userContextData['user'] = $userData;
		if (!$userId) {
            throw new Exception('Failed to create account');
        }
        
        return $userContextData;
    }
    
    /**
     * Authenticate user login
     */
    public function login($email, $password) {
        // Find user by email
        $user = $this->userRepository->findByEmail($email);

		if (!$user) {
            throw new Exception('Invalid email or password');
        }
        
        // Verify password
        if (!password_verify($password, $user['password'])) {
            throw new Exception('Invalid email or password');
        }

		$store = $this->storeRepository->findByUserId($user['user_id']);

		$userContext = [
			'user' => $user,
			'store' => $store
		];
        return $userContext;
    }
    
    /**
     * Update user profile
     */
    public function updateProfile($userId, $data) {
        $existingUser = $this->userRepository->findByEmail($data['email']);
        if ($existingUser && $existingUser['user_id'] != $userId) {
            throw new Exception('Email already used by another account');
        }
        
        $profileData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'address' => $data['address']
        ];
        
        if (!$this->userRepository->updateProfile($userId, $profileData)) {
            throw new Exception('Failed to update profile');
        }
        
        return $this->userRepository->find($userId);
    }
    
    /**
     * Change user password
     */
    public function changePassword($userId, $currentPassword, $newPassword, $confirmPassword) {
        $user = $this->userRepository->find($userId);
        if (!$user) {
            throw new Exception('User not found');
        }
        
        if (!password_verify($currentPassword, $user['password'])) {
            throw new Exception('Current password is incorrect');
        }
        
        if ($newPassword !== $confirmPassword) {
            throw new Exception('New password confirmation does not match');
        }
        
        if (strlen($newPassword) < 6) {
            throw new Exception('New password must be at least 6 characters');
        }
        
        if (!$this->userRepository->changePassword($userId, $newPassword)) {
            throw new Exception('Failed to change password');
        }
        
        return true;
    }
    
    /**
     * Top up user balance
     */
    public function topUpBalance($userId, $amount) {
        if (!is_numeric($amount) || $amount <= 0) {
            throw new Exception('Invalid top-up amount');
        }
        
        $user = $this->userRepository->find($userId);
        if (!$user) {
            throw new Exception('User not found');
        }
        
        if ($user['role'] !== 'BUYER') {
            throw new Exception('Only buyers can top up balance');
        }
        
        $newBalance = ($user['balance'] ?? 0) + $amount;
        
        if (!$this->userRepository->updateBalance($userId, $newBalance)) {
            throw new Exception('Failed to update balance');
        }
        
        return $this->userRepository->find($userId);
    }
    
    /**
     * Get user by ID
     */
    public function getUserById($userId) {
        return $this->userRepository->find($userId);
    }
    
    /**
     * Check if user exists by email
     */
    public function userExistsByEmail($email) {
        return $this->userRepository->emailExists($email);
    }
}