<?php
$currentStatus = $status_filter ?? 'all';
$statuses = ['all', 'waiting_approval', 'approved', 'on_delivery', 'received', 'rejected'];
?>

<style>@import url('/css/pages/seller/orders.css');</style>

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
                        <th>Toko</th>
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
                            <td><?= View::escape($order['store_name']) ?></td>
                            <td><?= View::currency($order['total_price']) ?></td>
                            <td>
                                <span class="status-badge <?= htmlspecialchars($order['status']) ?>">
                                    <?= ucfirst(str_replace('_', ' ', $order['status'])) ?>
                                </span>
                            </td>
                            <td style="text-align: right;">
                                <button type="button" onclick="window.location='/orders/show?id=<?= $order['order_id'] ?>'" class="btn-detail">Detail</button>
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