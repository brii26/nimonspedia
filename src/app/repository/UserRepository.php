<?php

class UserRepository extends BaseRepository {
    protected $table = 'users';
    
    /**
     * Override primary key for users table
     */
    protected function getPrimaryKey() {
        return 'user_id';
    }
    
    /**
     * Find user by email
     */
    public function findByEmail($email) {
        return $this->whereFirst('email = ?', [$email]);
    }
    
    /**
     * Create new user with hashed password
     */
    public function createUser($userData) {
        // Hash password before storing
        if (isset($userData['password'])) {
            $userData['password'] = password_hash($userData['password'], PASSWORD_DEFAULT);
        }
        
        // Set default balance for buyers
        if ($userData['role'] === 'BUYER' && !isset($userData['balance'])) {
            $userData['balance'] = 0;
        }
        
        // Add timestamps
        $userData['created_at'] = date('Y-m-d H:i:s');
        $userData['updated_at'] = date('Y-m-d H:i:s');
        
        return $this->create($userData);
    }
    
    /**
     * Update user balance (for buyers)
     */
    public function updateBalance($userId, $newBalance) {
        return $this->update($userId, [
            'balance' => $newBalance,
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    /**
     * Update user profile (excluding sensitive fields)
     */
    public function updateProfile($userId, $profileData) {
        // Remove sensitive fields that shouldn't be updated via profile
        unset($profileData['password'], $profileData['role'], $profileData['balance']);
        
        // Add updated timestamp
        $profileData['updated_at'] = date('Y-m-d H:i:s');
        
        return $this->update($userId, $profileData);
    }
    
    /**
     * Change user password
     */
    public function changePassword($userId, $newPassword) {
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        
        return $this->update($userId, [
            'password' => $hashedPassword,
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    /**
     * Check if email exists (for registration validation)
     */
    public function emailExists($email) {
        return $this->count('email = ?', [$email]) > 0;
    }
    
    /**
     * Get user statistics (for admin)
     */
    public function getUserStats() {
        $totalUsers = $this->count();
        $buyersCount = $this->count('role = ?', ['BUYER']);
        $sellersCount = $this->count('role = ?', ['SELLER']);
        
        return [
            'total' => $totalUsers,
            'buyers' => $buyersCount,
            'sellers' => $sellersCount
        ];
    }
}