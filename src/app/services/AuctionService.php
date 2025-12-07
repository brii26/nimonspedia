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
        $storeId = $this->storeService->getSellerStoreId();
        if (!$storeId) {
            throw new Exception("Store not found for current user.");
        }

        $productId = (int)$data['product_id'];
        $product = $this->productRepo->find($productId);

        if (!$product) {
            throw new Exception("Product not found.");
        }

        // Validate Ownership (Business Logic remains, but we don't save store_id to DB)
        if ((int)$product['store_id'] !== $storeId) {
            throw new Exception("Unauthorized: Product does not belong to your store.");
        }

        if ($this->auctionRepo->findActiveByProductId($productId)) {
            throw new Exception("Product is already in an active auction.");
        }

        $auctionQty = (int)$data['quantity'];
        if ($product['stock'] < $auctionQty) {
            throw new Exception("Insufficient stock. Available: {$product['stock']}, Requested: {$auctionQty}");
        }

        // Prepare data matching your exact SQL Schema
        $auctionData = [
            'product_id' => $productId,
            'start_time' => $data['start_time'],
            'end_time'   => $data['end_time'],
            'quantity' => $auctionQty,
            'starting_price' => (float)$data['start_price'], // Schema uses 'starting_price'
            'current_price' => (float)$data['start_price'],
            'min_increment' => (float)$data['min_increment'],
        ];

        // Begin Transaction
        $db = Database::getInstance();
        $db->beginTransaction();

        try {
            // 1. Create Auction
            $auctionId = $this->auctionRepo->createAuction($auctionData);

            if (!$auctionId) {
                throw new Exception("Failed to create auction record.");
            }

            // 2. Deduct Stock from Product
            $newStock = $product['stock'] - $auctionQty;
            $this->productRepo->update($productId, ['stock' => $newStock]);

            // 3. Update Product to link auction (Optional logic, based on your flow)
            // Note: Your 'products' table schema doesn't have 'auction_id' column in the CREATE TABLE script.
            // If you added it later, uncomment this line. If not, this logic relies on the auction table pointing to the product.
            // $this->productRepo->update($productId, ['auction_id' => $auctionId]);

            $db->commit();
            return $auctionId;

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
}