<?php
$orders = $ordersData['orders'] ?? ($orders ?? []);
$currentPage = $currentPage ?? 1;
$totalPages = $totalPages ?? 1;
?>

<div class="order-card-list">
    <?php if (empty($orders)): ?>
        <div class="empty-state">
            <p>No orders <?= $currentStatus !== 'all' ? "dengan status '$currentStatus'" : '' ?>.</p>
        </div>
    <?php else: ?>
        <?php foreach ($orders as $order): ?>
            <article class="order-card">
			<header class="order-card-header">
				<div>
					<span class="order-card-store">Buyer: <strong><?= View::escape($order['buyer_name'] ?? 'N/A') ?></strong></span>
					<span class="order-id-display">Order ID: #<?= View::escape($order['order_id']) ?></span>
				</div>
				<div id="right-order-header-section">
					<span class="order-card-date"><?= View::date($order['created_at'], 'd M Y') ?></span>
					<span class="status-badge <?= htmlspecialchars($order['status']) ?>">
						<?= ucfirst(str_replace('_', ' ', htmlspecialchars($order['status']))) ?>
					</span>
				</div>
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
                                <div class="order-item-qty"><?= View::escape($firstItem['quantity']) ?> items</div>
                                <?php if (count($order['items']) > 1): ?>
                                    <div class="order-item-more">+<?= (count($order['items']) - 1) ?> more products</div>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php else: ?>
                        <span style="color: #888; font-size: 0.9rem; padding: 1rem 0;">(Product not found)</span>
                    <?php endif; ?>
                </div>

                <footer class="order-card-footer">
                    <div class="order-total">
                        <span>Total</span>
                        <strong><?= View::currency($order['total_price']) ?></strong>
                    </div>
                    <div class="order-actions">
                        <button type="button" 
                                onclick="showOrderDetail(<?php echo $order['order_id']; ?>)"
                                class="btn-detail">
                            View Details
                        </button>
                        
                        <?php if ($order['status'] === 'waiting_approval'): ?>
                            <button type="button" onclick="approveOrder(<?php echo $order['order_id']; ?>)" id="btn-approve">
                                Approve
                            </button>
                            <button type="button" onclick="showRejectModal(<?php echo $order['order_id']; ?>)" id="btn-reject">
                                Reject
                            </button>
                        <?php endif; ?>

                        <?php if ($order['status'] === 'approved'): ?>
                            <button type="button"
                                    onclick="showDeliveryModal(<?php echo $order['order_id']; ?>)"
                                    class="btn-delivery">
                                Set Delivery
                            </button>
                        <?php endif; ?>
                    </div>
                </footer>
            </article>
        <?php endforeach; ?>
    <?php endif; ?>
</div>

<?php if ($totalPages > 1): ?>
    <div class="pagination">
        <?php
        $queryParams = $_GET; // Menggunakan $_GET untuk mengambil parameter filter yang ada (search, status)
        for ($i = 1; $i <= $totalPages; $i++) {
            $queryParams['page'] = $i;
            $queryString = http_build_query($queryParams);
            $class = $i === $currentPage ? 'active' : '';
            echo "<a href='?{$queryString}' class='{$class}'>{$i}</a>";
        }
        ?>
    </div>
<?php endif; ?>