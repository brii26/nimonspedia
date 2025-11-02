<?php

class ReportService {
    private $reportRepository;

    public function __construct(ReportRepository $reportRepository) {
        $this->reportRepository = $reportRepository;
    }

    /**
     * Menghasilkan dan mengirimkan file CSV laporan penjualan.
     *
     * @param int $storeId ID toko
     */
    public function generateSalesReportCSV(int $storeId) {
        $salesData = $this->reportRepository->getAllStoreData($storeId);

        $filename = "laporan_penjualan_" . $storeId . "_" . date('Ymd_His') . ".csv";

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache');
        header('Expires: 0');

        $handle = fopen('php://output', 'w');

        fputcsv($handle, [
            'Order ID',
            'Status',
            'Alasan Reject',
            'Tanggal Order',
            'Tanggal Selesai',
            'Nama Pembeli',
            'Email Pembeli',
            'Product ID',
            'Nama Produk',
            'Jumlah Terjual',
            'Harga Satuan (Rp)',
            'Subtotal (Rp)'
        ]);

        if (!empty($salesData)) {
            foreach ($salesData as $row) {
                fputcsv($handle, [
                    $row['order_id'],
                    $row['status'],
                    $row['reject_reason'],
                    $row['order_date'],
                    $row['completed_date'],
                    $row['buyer_name'],
                    $row['buyer_email'],
                    $row['product_id'],
                    $row['product_name'],
                    $row['quantity_sold'],
                    $row['price_per_item'],
                    $row['subtotal']
                ]);
            }
        } else {
            fputcsv($handle, ['Tidak ada data penjualan yang selesai ditemukan.']);
        }

        fclose($handle);

        exit;
    }
}