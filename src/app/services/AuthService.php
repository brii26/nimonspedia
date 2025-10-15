<?php

class AuthService {
    private $userRepository;
    
    public function __construct() {
        $this->userRepository = new UserRepository();
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
        
        $userData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'],
            'address' => $data['address']
        ];

        $userId = $this->userRepository->createUser($userData);
        
        if (!$userId) {
            throw new Exception('Failed to create account');
        }
        
        // Return created user
        return $this->userRepository->find($userId);
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
        // Get user data
        $user = $this->userRepository->find($userId);
        if (!$user) {
            throw new Exception('User not found');
        }
        
        // Verify current password
        if (!password_verify($currentPassword, $user['password'])) {
            throw new Exception('Current password is incorrect');
        }
        
        // Validate new password confirmation
        if ($newPassword !== $confirmPassword) {
            throw new Exception('New password confirmation does not match');
        }
        
        // Validate new password strength
        if (strlen($newPassword) < 6) {
            throw new Exception('New password must be at least 6 characters');
        }
        
        // Change password
        if (!$this->userRepository->changePassword($userId, $newPassword)) {
            throw new Exception('Failed to change password');
        }
        
        return true;
    }
    
    /**
     * Top up user balance
     */
    public function topUpBalance($userId, $amount) {
        // Validate amount
        if (!is_numeric($amount) || $amount <= 0) {
            throw new Exception('Invalid top-up amount');
        }
        
        // Get current user
        $user = $this->userRepository->find($userId);
        if (!$user) {
            throw new Exception('User not found');
        }
        
        // Only buyers can top up balance
        if ($user['role'] !== 'BUYER') {
            throw new Exception('Only buyers can top up balance');
        }
        
        // Calculate new balance
        $newBalance = ($user['balance'] ?? 0) + $amount;
        
        // Update balance
        if (!$this->userRepository->updateBalance($userId, $newBalance)) {
            throw new Exception('Failed to update balance');
        }
        
        return $newBalance;
    }
    
    /**
     * Validate user input for registration
     */
    public function validateRegistrationData($data) {
        $errors = [];
        
        if (empty($data['name']) || strlen($data['name']) < 2) {
            $errors['name'] = 'Name must be at least 2 characters';
        }
        
        if (strlen($data['name']) > 100) {
            $errors['name'] = 'Name must not exceed 100 characters';
        }
        
        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Valid email is required';
        }
        
        if (empty($data['password']) || strlen($data['password']) < 6) {
            $errors['password'] = 'Password must be at least 6 characters';
        }
        
        if (empty($data['password_confirmation'])) {
            $errors['password_confirmation'] = 'Password confirmation is required';
        }

        if (empty($data['role']) || !in_array($data['role'], ['BUYER', 'SELLER'])) {
            $errors['role'] = 'Valid role is required';
        }

        if (empty($data['address']) || strlen($data['address']) < 10) {
            $errors['address'] = 'Address must be at least 10 characters';
        }
        
        if (!empty($errors)) {
            throw new ValidationException($errors);
        }
        
        return true;
    }
    
    /**
     * Validate user input for login
     */
    public function validateLoginData($data) {
        $errors = [];
        
        // Email validation
        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Valid email is required';
        }
        
        // Password validation
        if (empty($data['password'])) {
            $errors['password'] = 'Password is required';
        }
        
        if (!empty($errors)) {
            throw new ValidationException($errors);
        }
        
        return true;
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