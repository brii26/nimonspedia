<?php
$currentStatus = $status_filter ?? 'all';
$statuses = ['all', 'waiting_approval', 'approved', 'on_delivery', 'received', 'rejected'];
$hasMore = $has_more ?? false;
?>

<div class="orders-container">
    <h1 class="mb-4">My Orders</h1>

    <div class="status-tabs">
        <?php foreach ($statuses as $status): ?>
            <?php $isActive = ($currentStatus === $status) ? 'active' : ''; ?>
            <?php $href = ($status === 'all') ? '/orders' : '/orders?status=' . urlencode($status); ?>
            <a href="<?= $href ?>" class="tab <?= $isActive ?>" data-status="<?= $status ?>"><?= ucfirst(str_replace('_', ' ', $status)) ?></a>
        <?php endforeach; ?>
    </div>

    <div id="order-list-container">
        <div class="order-card-list" id="order-list">
            <?php if (empty($orders)): ?>
                <div class="empty-state">
                    <p>No orders <?= $currentStatus !== 'all' ? "dengan status '$currentStatus'" : '' ?>.</p>
                </div>
            <?php else: ?>
                <?php foreach ($orders as $order): ?>
                    <?= View::component('order-card', ['order' => $order]); ?>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
        
        <!-- Sentinel for infinite scroll -->
        <?php if (!empty($orders) && $hasMore): ?>
            <div id="scroll-sentinel" class="scroll-sentinel">
                <div class="loading-spinner"></div>
            </div>
        <?php endif; ?>
    </div>
</div>

<script>
    window.ordersConfig = {
        currentStatus: '<?= View::escape($currentStatus) ?>',
        currentPage: <?= (int)$current_page ?>,
        hasMore: <?= $hasMore ? 'true' : 'false' ?>
    };
</script>