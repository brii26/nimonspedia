<?php

require_once __DIR__ . '/../../core/Database.php';

class FeatureFlagService {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Helper untuk mengambil instance dan koneksi DB
     */
    private static function getInstance() {
        return new self();
    }

    private static function mapFlag($flagName) {
        $map = [
            'checkout_enabled' =>'Checkout',
            'chat_enabled' =>'Chat',
            'auction_enabled' =>'Auction'
        ];
        return $map[$flagName];
    }

    /**
     * Cek akses fitur dengan hierarki:
     * 1. Global mati? -> False (Maintenance Mode)
     * 2. User spesifik mati? -> False (Banned/Restricted)
     * 3. Default -> True
     */
    public static function checkAccess($userId, $featureName) {
        $service = self::getInstance();
        
        // 1. Cek Global Flag
        $queryGlobal = "SELECT is_enabled, reason FROM user_feature_access WHERE feature_name = :name AND user_id IS NULL LIMIT 1";
        $global = $service->db->selectOne($queryGlobal, [
            ':name' => $featureName
        ]);

        $isGlobalEnabled = ($global && ($global['is_enabled'] === true || $global['is_enabled'] === 't' || $global['is_enabled'] === 1));

        if ($global && !$isGlobalEnabled) {
            return [
                'allowed' => false, 
                'reason' => $global['reason'] ?? 'Fitur ini sedang maintenance.'
            ];
        }

        // 2. Cek User Flag (Jika ada user yang login)
        if ($userId) {
            $queryUser = "SELECT is_enabled, reason FROM user_feature_access WHERE feature_name = :name AND user_id = :uid LIMIT 1";
            $userFlag = $service->db->selectOne($queryUser, [
                ':name' => $featureName,
                ':uid' => $userId
            ]);

            $isUserEnabled = ($userFlag && ($userFlag['is_enabled'] === true || $userFlag['is_enabled'] === 't' || $userFlag['is_enabled'] === 1));

            // Jika ada pengaturan spesifik user dan dimatikan
            if ($userFlag && !$isUserEnabled) {
                return [
                    'allowed' => false, 
                    'reason' => $userFlag['reason'] ?? 'Akun Anda dibatasi untuk fitur ini.'
                ];
            }
        }

        return ['allowed' => true];
    }

    /**
     * Mengambil daftar fitur yang dinonaktifkan untuk user ini (atau global)
     */
    public static function getDisabledFeatures($userId) {
        $service = self::getInstance();
        
        $features = $service->db->select("SELECT DISTINCT feature_name FROM user_feature_access");
        
        $disabledList = [];
        
        foreach ($features as $f) {
            $name = $f['feature_name'];
            $access = self::checkAccess($userId, $name);
            
            if (!$access['allowed']) {
                $disabledList[] = [
                    'feature' => self::mapFlag($name),
                    'reason' => $access['reason']
                ];
            }
        }
        
        return $disabledList;
    }
}