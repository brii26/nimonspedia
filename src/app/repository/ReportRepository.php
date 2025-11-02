<?php

class ReportRepository extends BaseRepository{
    /**
     * Mengambil semua data penjualan yang telah selesai (status 'received')
     * untuk sebuah toko, digabung dengan data produk dan buyer.
     *
     * @param int $storeId ID toko
     * @return array Data laporan penjualan
     */
    public function getAllStoreData(int $storeId): array
    {
        $sql = "
            SELECT 
                o.order_id,
                o.status,
                o.created_at AS order_date,
                o.received_at AS completed_date,
                o.reject_reason,
                p.product_id,
                p.product_name,
                oi.quantity AS quantity_sold,
                oi.price_at_order AS price_per_item,
                oi.subtotal,
                u.name AS buyer_name,
                u.email AS buyer_email
            FROM 
                orders o
            JOIN 
                order_items oi ON o.order_id = oi.order_id
            JOIN 
                products p ON oi.product_id = p.product_id
            JOIN 
                users u ON o.buyer_id = u.user_id
            WHERE 
                o.store_id = ?
            ORDER BY 
                o.received_at DESC;
        ";
        
        return $this->db->select($sql, [$storeId]);
    }
}

