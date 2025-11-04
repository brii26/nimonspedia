<?php

class ReportController extends BaseController {
    
    private $reportService;
    private $storeRepository;

    public function __construct() {
        parent::__construct();
        $this->reportService = new ReportService(new ReportRepository());
        $this->storeRepository = new StoreRepository();
    }

    public function exportSales() {
        try {
            $this->requireRole('SELLER');
            $userId = Auth::id();
            $store = $this->storeRepository->findByUserId($userId);
            if (!$store || !isset($store['store_id'])) {
                throw new Exception("Informasi toko tidak ditemukan untuk seller ini.");
            }
            $storeId = $store['store_id'];
            $this->reportService->generateSalesReportCSV($storeId);

        } catch (Exception $e) {
            error_log("Gagal membuat laporan penjualan: " . $e->getMessage());
            
            $_SESSION['error'] = 'Gagal membuat laporan: ' . $e->getMessage();
            $this->redirect('/');
        }
    }
}