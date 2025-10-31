<?php
$currentStatus = $status_filter ?? 'all';
$statuses = ['all', 'waiting_approval', 'approved', 'on_delivery', 'received', 'rejected'];
?>

<div class="container mt-4">
    <h1 class="mb-4">Pesanan Saya</h1>

    <?php if (!empty($error)): ?>
        <div class="alert alert-danger"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <div class="card">
        <div class="card-header">
            <ul class="nav nav-tabs card-header-tabs">
                <?php foreach ($statuses as $status): ?>
                    <li class="nav-item">
                        <?php 
                            $isActive = $currentStatus === $status ? 'active' : '';
                            // For 'all' we want a clean /orders link without query string
                            $href = ($status === 'all') ? '/orders' : '/orders?status=' . urlencode($status);
                        ?>
                        <a class="nav-link <?= $isActive ?>" href="<?= $href ?>"><?= ucfirst(str_replace('_', ' ', $status)) ?></a>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
        <div class="card-body">
            <?php if (empty($orders)): ?>
                <p class="text-center">Tidak ada pesanan <?= $currentStatus !== 'all' ? "dengan status '$currentStatus'" : '' ?>.</p>
            <?php else: ?>
                <div class="table-responsive">
                    <table class="table">
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
                                        <span class="badge badge-<?= $order['status'] === 'cancelled' ? 'danger' : 
                                            ($order['status'] === 'delivered' ? 'success' : 'info') ?>">
                                            <?= ucfirst($order['status']) ?>
                                        </span>
                                    </td>
                                    <td>
                                        <a href="/orders/show?id=<?= $order['order_id'] ?>" 
                                           class="btn btn-sm btn-outline-primary">
                                            Detail
                                        </a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <?php if ($total_pages > 1): ?>
                    <nav class="mt-4">
                        <ul class="pagination justify-content-center">
                            <?php 
                                $statusParam = ($currentStatus && $currentStatus !== 'all') ? '&status=' . urlencode($currentStatus) : '';
                                for ($i = 1; $i <= $total_pages; $i++): 
                            ?>
                                <li class="page-item <?= $i === $current_page ? 'active' : '' ?>">
                                    <a class="page-link" href="/orders?page=<?= $i ?><?= $statusParam ?>">
                                        <?= $i ?>
                                    </a>
                                </li>
                            <?php endfor; ?>
                        </ul>
                    </nav>
                <?php endif; ?>
            <?php endif; ?>
        </div>
    </div>
</div>