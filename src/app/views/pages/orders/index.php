<?php
$currentStatus = $status_filter ?? 'all';
$statuses = ['all', 'waiting_approval', 'approved', 'on_delivery', 'received', 'rejected'];
?>

<div class="orders-container">
    <h1 class="mb-4">Pesanan Saya</h1>

    <div class="status-tabs">
        <?php foreach ($statuses as $status): ?>
            <?php $isActive = ($currentStatus === $status) ? 'active' : ''; ?>
            <?php $href = ($status === 'all') ? '/orders' : '/orders?status=' . urlencode($status); ?>
            <a href="<?= $href ?>" class="tab <?= $isActive ?>"><?= ucfirst(str_replace('_', ' ', $status)) ?></a>
        <?php endforeach; ?>
    </div>

    <div class="orders-table">
        <?php if (empty($orders)): ?>
            <div class="empty-state">
                <p>Tidak ada pesanan <?= $currentStatus !== 'all' ? "dengan status '$currentStatus'" : '' ?>.</p>
            </div>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Tanggal</th>
                        <th>Detail Produk</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($orders as $order): ?>
                        <tr>
                            <td>#<?= View::escape($order['order_id']) ?></td>
                            
                            <td><?= View::date($order['created_at']) ?></td>

                            <td>
                                <?php if (!empty($order['items'])): ?>
                                    <?php $firstItem = $order['items'][0]; // Ambil 1 item sebagai preview ?>
                                    <div class="order-item-preview">
                                        <img src="/storage/<?= View::escape($firstItem['main_image_path'] ?? 'images/product_placeholder.png') ?>" 
                                            alt="<?= View::escape($firstItem['product_name']) ?>" 
                                            class="order-item-thumbnail">

                                        <div class="order-item-info">
                                            <div class="order-item-name">
                                                <?= View::escape($firstItem['product_name']) ?>
                                            </div>
                                            <div class="order-item-qty">
                                                <?= View::escape($firstItem['quantity']) ?> barang
                                            </div>
                                            <?php if (count($order['items']) > 1): ?>
                                                <div class="order-item-more">
                                                    +<?= (count($order['items']) - 1) ?> produk lainnya
                                                </div>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                <?php else: ?>
                                    <span style="color: #888;">(Produk tidak ditemukan)</span>
                                <?php endif; ?>
                            </td>

                            <td><?= View::currency($order['total_price']) ?></td>

                            <td>
                                <span class="status-badge <?= htmlspecialchars($order['status']) ?>">
                                    <?= ucfirst(str_replace('_', ' ', htmlspecialchars($order['status']))) ?>
                                </span>
                            </td>
                            
                            <td>
                                <a href="/orders/show?id=<?= View::escape($order['order_id']) ?>" class="btn-detail" style="text-decoration: none;">
                                    View Details
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>

    <?php if ($total_pages > 1): ?>
        <div class="pagination">
            <?php
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
    </div>
</div>