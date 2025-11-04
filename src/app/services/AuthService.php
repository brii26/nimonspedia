<?php

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
        
		$storeName = null;
        if ($data['role'] === 'SELLER') {
            $storeName = $data['store_name'] ?? ($data['name'] . "'s Store");
            if (empty(trim($storeName))) {
                throw new Exception('Store name cannot be empty');
            }
            if ($this->storeRepository->findByName($storeName)) {
                throw new Exception('Store name is already taken');
            }
        }

        $db = Database::getInstance();
        
        try {
            $db->beginTransaction();

            $userData = [
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => $data['role'],
                'address' => $data['address']
            ];

            $userId = $this->userRepository->createUser($userData);
            if (!$userId) {
                throw new Exception('Failed to create user account');
            }

            // Jika user adalah SELLER, buat juga tokonya
            if ($data['role'] === 'SELLER') {
                $storeDesc = SanitizerService::sanitizeRichText($data['store_description']) ?? null;
                $storeLogo = $data['store_logo'] ?? null;
                $storeLogoPath = FileService::saveUploadedImage($storeLogo,'store_logo') ?? null;
                
                // Kita gunakan $storeName yang sudah divalidasi di atas
                $storeId = $this->storeRepository->createStore($userId, $storeName, $storeDesc, $storeLogoPath);
                
                if (!$storeId) {
                    throw new Exception('Failed to create store for the user');
                }
            }

            $db->commit();
            return $this->userRepository->find($userId);
        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        return $this->userRepository->find($userId);
    }
    
    /**
     * Authenticate user login
     */
    public function login($email, $password) {
        // Find user by email
        $user = $this->userRepository->findByEmail($email);
        
        if (!$user) {
            throw new ValidationException('Invalid email or password');
        }
        
        // Verify password
        if (!password_verify($password, $user['password'])) {
            throw new ValidationException('Invalid email or password');
        }
        
        return $user;
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
        
        if (strlen($newPassword) < 8) {
            throw new Exception('New password must be at least 8 characters');
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