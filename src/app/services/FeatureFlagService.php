<?php

require_once __DIR__ . '/../../core/Database.php';

class FeatureFlagService {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    /**
     * Cek akses fitur dengan hierarki:
     * 1. Global mati? -> False (Maintenance Mode)
     * 2. User spesifik mati? -> False (Banned/Restricted)
     * 3. Default -> True
     */
    public static function checkAccess($userId, $featureName) {
        $instance = new self();
        
        // 1. Cek Global Flag
        // Query: Cari flag dengan feature_name tersebut yang user_id-nya NULL
        $queryGlobal = "SELECT is_enabled FROM user_feature_access WHERE feature_name = :name AND user_id IS NULL LIMIT 1";
        $instance->db->query($queryGlobal);
        $instance->db->bind(':name', $featureName);
        $global = $instance->db->single();

        // Postgres mengembalikan boolean 't'/'f' atau 1/0
        $isGlobalEnabled = ($global && ($global['is_enabled'] === true || $global['is_enabled'] === 't' || $global['is_enabled'] === 1));

        // Jika Global Flag ada di DB dan statusnya FALSE, maka blokir akses (Maintenance Mode)
        if ($global && !$isGlobalEnabled) {
            return [
                'allowed' => false, 
                'reason' => 'Fitur sedang dalam pemeliharaan sistem (Global Maintenance).'
            ];
        }

        if ($userId) {
            $queryUser = "SELECT is_enabled, reason FROM user_feature_access WHERE feature_name = :name AND user_id = :uid LIMIT 1";
            $instance->db->query($queryUser);
            $instance->db->bind(':name', $featureName);
            $instance->db->bind(':uid', $userId);
            $userFlag = $instance->db->single();

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
}