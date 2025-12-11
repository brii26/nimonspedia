<?php

class AuctionService {
    private $auctionRepo;
    private $productRepo;
    private $storeService;

    public function __construct() {
        $this->auctionRepo = new AuctionRepository();
        $this->productRepo = new ProductRepository();
        $this->storeService = new StoreService();
    }

    public function createAuction($data) {
        
        // Validasi Store & User
        $storeId = $this->storeService->getSellerStoreId();
        if (!$storeId) {
            throw new Exception("Store not found for current user.");
        }

        // Validasi Produk
        $productId = (int)$data['product_id'];
        $product = $this->productRepo->find($productId);

        if (!$product) {
            throw new Exception("Product not found.");
        }

        if ((int)$product['store_id'] !== $storeId) {
            throw new Exception("Unauthorized: Product does not belong to your store.");
        }

        $startTime = $data['start_time'];
        $endTime   = $data['end_time'];

        // Validasi Overlapping
        $conflictingProductName = $this->auctionRepo->getOverlappingProduct($startTime, $endTime);
        if ($conflictingProductName) {
            throw new Exception("Schedule overlaps with: " . $conflictingProductName);
        }

        // Validasi Stock
        $auctionQty = (int)$data['quantity'];
        if ($product['stock'] < $auctionQty) {
            throw new Exception("Insufficient stock. Available: {$product['stock']}, Requested: {$auctionQty}");
        }

        $auctionData = [
            'product_id' => $productId,
            'start_time' => $data['start_time'],
            'end_time'   => $data['end_time'],
            'quantity' => $auctionQty,
            'starting_price' => (float)$data['start_price'],
            'current_price' => (float)$data['start_price'],
            'min_increment' => (float)$data['min_increment'],
        ];

        
        $this->auctionRepo->beginTransaction();

        try {
            $auctionId = $this->auctionRepo->createAuction($auctionData);

            if (!$auctionId) {
                throw new Exception("Failed to create auction record.");
            }

            $newStock = $product['stock'] - $auctionQty;
            $this->productRepo->update($productId, ['stock' => $newStock]);
            $this->auctionRepo->commit();
            return $auctionId;

        } catch (Exception $e) {
            $this->auctionRepo->rollBack();
            throw $e;
        }
    }

    public function getAuctionsByProduct($productId) {
        return $this->auctionRepo->findAllByProductId($productId);
    }

    public function cancelAuction($auctionId, $storeId) {
        return $this->auctionRepo->cancelAuction($auctionId, $storeId);
    }
}