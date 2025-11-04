<div class="orders-container" style="max-width: 900px;">
    
    <header class="page-header" style="text-align: center; margin-bottom: 2rem;">
        <h1 style="color: #28a745;">Checkout Berhasil!</h1>
        <p>Pesanan Anda telah kami terima dan akan segera diproses oleh masing-masing toko.</p>
    </header>

    <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem; color: #333;">Ringkasan Pesanan Anda</h3>
    
    <div class="order-card-list">
        <?php if (empty($orders)): ?>
            <div class="empty-state">
                <p>Tidak ada detail pesanan untuk ditampilkan.</p>
            </div>
        <?php else: ?>
            <?php foreach ($orders as $order): ?>
                <article class="order-card">
                    <header class="order-card-header">
                        <span class="order-card-store">Toko: <strong><?= View::escape($order['store_name'] ?? 'N/A') ?></strong></span>
                        <span class="order-card-date">Order ID: #<?= View::escape($order['order_id']) ?></span>
                        <span class="status-badge <?= htmlspecialchars($order['status']) ?>">
                            <?= ucfirst(str_replace('_', ' ', htmlspecialchars($order['status']))) ?>
                        </span>
                    </header>

                    <div class="order-card-body">
                        <?php if (!empty($order['items'])): ?>
                            <?php $firstItem = $order['items'][0]; ?>
                            <div class="order-item-preview">
                                <img src="/storage/<?= View::escape($firstItem['main_image_path'] ?? 'product_images/default-product.svg') ?>" 
                                     alt="<?= View::escape($firstItem['product_name']) ?>" 
                                     class="order-item-thumbnail">
                                <div class="order-item-info">
                                    <div class="order-item-name"><?= View::escape($firstItem['product_name']) ?></div>
                                    <div class="order-item-qty"><?= View::escape($firstItem['quantity']) ?> barang</div>
                                    <?php if (count($order['items']) > 1): ?>
                                        <div class="order-item-more">+<?= (count($order['items']) - 1) ?> produk lainnya</div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endif; ?>
                    </div>

                    <footer class="order-card-footer">
                        <div class="order-total">
                            <span>Total Pesanan Ini</span>
                            <strong><?= View::currency($order['total_price']) ?></strong>
                        </div>
                        <div class="order-actions">
                            <a href="/orders/show?id=<?= View::escape($order['order_id']) ?>" class="btn btn-detail">
                                Lihat Detail Pesanan Ini
                            </a>
                        </div>
                    </footer>
                </article>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>

    <div class="text-center" style="margin-top: 2.5rem; display: flex; gap: 1rem; justify-content: center;">
        <a href="/" class="btn btn-secondary" style="background-color: #6c757d; color: white;">Kembali ke Beranda</a>
        <a href="/orders" class="btn btn-primary" style="background-color: #3498db; color: white;">Lihat Semua Pesanan Saya</a>
    </div>

</div>