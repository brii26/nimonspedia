<?php

class StoreService {
    private $storeRepo;

    public function __construct() {
        $this->storeRepo = new StoreRepository();
    }

    public function getSellerStoreId() {
        $user = Auth::user();
        if (!$user || $user['role'] !== 'SELLER') {
            return null;
        }
        $row = $this->storeRepo->findByUserId($user['user_id']);
        if (!$row) {
            return null;
        }
        return (int) $row['store_id'];
    }

    public function updateStore($post, $storeId) {
        $name = $post['store_name'];
        $desc = $post['store_description'] ?? '';
        $logoFile = $_FILES['store_logo'] ?? null;

        $old_logo = $this->getLogoPath($storeId) ?? ''; 
        $updatedLogoPath = $old_logo;

        if (isset($logoFile) && $logoFile['error'] === UPLOAD_ERR_OK) {
            $updatedLogoPath = FileService::saveUploadedImage($logoFile, 'store_logo', $old_logo);

        } else if (isset($logoFile) && $logoFile['error'] !== UPLOAD_ERR_NO_FILE) {
            throw new Exception("File upload error code: " . $logoFile['error']);
        }
        
        return $this->storeRepo->updateStore($storeId, $name, $desc, $updatedLogoPath);
    }

    public function getLogoPath($storeId) {
        return $this->storeRepo->getLogoPath($storeId);
    }

    public function getStoreForUser($userId) {
        return $this->storeRepo->findByUserId($userId);
    }
}
