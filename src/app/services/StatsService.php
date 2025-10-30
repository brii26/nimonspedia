<?php

class StatsService {
    private $storeRepo;
    private $productRepo;
    private $orderRepo;

    public function __construct() {
        $this->storeRepo = new StoreRepository();
        $this->productRepo = new ProductRepository();
        $this->orderRepo = new OrderRepository();
    }

    public function getSellerStats($storeId) {
        return [
            'total_products' => $this->productRepo->getTotalProducts($storeId),
            'total_orders' => $this->orderRepo->getTotalOrders($storeId),
            'revenue' => $this->orderRepo->getRevenue($storeId),
            'low_stocks' => $this->productRepo->getLowStocks($storeId)
        ];
    }
}
