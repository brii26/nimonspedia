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

    <div id="order-list-container">
        <?= View::component('order-list', [
                'orders' => $orders,
                'current_page' => $current_page,
                'total_pages' => $total_pages,
                'currentStatus' => $currentStatus
            ]);
        ?>
    </div>

</div>