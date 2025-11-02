<?php
// File: src/app/views/components/order-list.php
// ISINYA HANYA CARD LIST + PAGINATION
?>

<div class="order-card-list">
    <?php if (empty($orders)): ?>
        <div class="empty-state">
            <p>Tidak ada pesanan <?= $currentStatus !== 'all' ? "dengan status '$currentStatus'" : '' ?>.</p>
        </div>
    <?php else: ?>
        <?php foreach ($orders as $order): ?>
            <article class="order-card">
                <header class="order-card-header">
                    <span class="order-card-store">Toko: <strong><?= View::escape($order['store_name'] ?? 'N/A') ?></strong></span>
                    <span class="order-card-date"><?= View::date($order['created_at'], 'd M Y') ?></span>
                    <span class="status-badge <?= htmlspecialchars($order['status']) ?>">
                        <?= ucfirst(str_replace('_', ' ', htmlspecialchars($order['status']))) ?>
                    </span>
                </header>

                <div class="order-card-body">
                    <?php if (!empty($order['items'])): ?>
                        <?php $firstItem = $order['items'][0]; ?>
                        <div class="order-item-preview">
                            <img src="/storage/<?= View::escape($firstItem['main_image_path'] ?? 'images/product_placeholder.png') ?>" 
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
                    <?php else: ?>
                        <span style="color: #888; font-size: 0.9rem; padding: 1rem 0;">(Produk tidak ditemukan)</span>
                    <?php endif; ?>
                </div>

                <footer class="order-card-footer">
                    <div class="order-total">
                        <span>Total Belanja</span>
                        <strong><?= View::currency($order['total_price']) ?></strong>
                    </div>
                    <div class="order-actions">
                        <a href="/orders/show?id=<?= View::escape($order['order_id']) ?>" class="btn btn-detail">
                            Lihat Detail
                        </a>
                    </div>
                </footer>
            </article>
        <?php endforeach; ?>
    <?php endif; ?>
</div>

<?php if ($total_pages > 1): ?>
    <div class="pagination">
        <?php
        // Logika paginasi tetap sama
        $queryParams = $_GET;
        $window = 2;
        $lastNum = 0;
        for ($i = 1; $i <= $total_pages; $i++):
            $showNumber = false;
            if ($i == 1 || $i == $total_pages) {
                $showNumber = true;
            } elseif ($i >= ($current_page - $window) && $i <= ($current_page + $window)) {
                $showNumber = true;
            }
            if ($showNumber):
                if ($i > $lastNum + 1):
                    echo "<span class=\"pagination-item disabled\">...</span>";
                endif;
                $queryParams['page'] = $i;
                $queryString = http_build_query($queryParams);
                $isActive = ($i == $current_page) ? 'active' : '';
                echo "<a href=\"/orders?{$queryString}\" class=\"pagination-item {$isActive}\">{$i}</a>";
                $lastNum = $i;
            endif;
        endfor;
        ?>
    </div>
<?php endif; ?>