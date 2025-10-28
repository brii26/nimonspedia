<?php

class SellerService {
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

    public function updateStore($storeId, $name, $desc, $logo) {
        return $this->storeRepo->updateStore($storeId, $name, $desc, $logo);
    }

    public function getLogoPath($storeId) {
        return $this->storeRepo->getLogoPath($storeId);
    }

    public function removeLogoPath($storeId) {
        return $this->storeRepo->removeLogoPath($storeId);
    }
}
