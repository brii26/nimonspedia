<?php
$statuses = ['waiting_approval', 'approved', 'on_delivery', 'received', 'rejected'];
$currentStatus = $currentStatus ?? null;
$search = $search ?? '';
$currentPage = $currentPage ?? 1;
$orders = $ordersData['orders'] ?? [];
$totalPages = $ordersData['totalPages'] ?? 1;
?>

<div class="orders-container">
    <!-- Status Filter Tabs -->
    <div class="status-tabs">
        <a href="/seller/orders" class="tab <?php echo !$currentStatus ? 'active' : ''; ?>">All</a>
        <?php foreach ($statuses as $status): ?>
            <a href="/seller/orders?status=<?php echo $status; ?>" 
               class="tab <?php echo $currentStatus === $status ? 'active' : ''; ?>">
                <?php echo ucwords(str_replace('_', ' ', $status)); ?>
            </a>
        <?php endforeach; ?>
    </div>

    <!-- Search Form -->
    <form class="search-form" method="GET" action="/seller/orders">
        <?php if ($currentStatus): ?>
            <input type="hidden" name="status" value="<?php echo $currentStatus; ?>">
        <?php endif; ?>
        <input type="text" 
               name="search" 
               placeholder="Search by Order ID or Buyer Name"
               value="<?php echo htmlspecialchars($search); ?>">
        <button type="submit">Search</button>
    </form>
	
    <!-- Orders Table -->
    <div class="orders-table">
        <?php if (empty($orders)): ?>
            <div class="empty-state">
                <p>No orders found</p>
                <?php if ($search): ?>
                    <p>Try different search terms</p>
                <?php elseif ($currentStatus): ?>
                    <p>No orders with status: <?php echo ucwords(str_replace('_', ' ', $currentStatus)); ?></p>
                <?php endif; ?>
            </div>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Buyer</th>
                        <th>Products</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($orders as $order): ?>
                        <tr>
                            <td>#<?php echo $order['order_id']; ?></td>
                            <td><?php echo date('Y-m-d H:i', strtotime($order['created_at'])); ?></td>
                            <td><?php echo htmlspecialchars($order['buyer_name']); ?></td>
                            <td>
                                <ul class="order-items">
                                    <?php foreach ($order['items'] as $item): ?>
                                        <li>
                                            <?php echo htmlspecialchars($item['product_name']); ?>
                                            (x<?php echo $item['quantity']; ?>)
                                        </li>
                                    <?php endforeach; ?>
                                </ul>
                            </td>
                            <td>Rp <?php echo number_format($order['total_price']); ?></td>
                            <td>
                                <span class="status-badge <?php echo $order['status']; ?>">
                                    <?php echo ucwords(str_replace('_', ' ', $order['status'])); ?>
                                </span>
                            </td>
                            <td>
                                <button type="button" 
                                        onclick="showOrderDetail(<?php echo $order['order_id']; ?>)"
                                        class="btn-detail">
                                    View Details
                                </button>
                                
                                <?php if ($order['status'] === 'waiting_approval'): ?>
                                    <button type="button" id="btn-approve" onclick="approveOrder(<?php echo $order['order_id']; ?>)" id="btn-approve">
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
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>

    <!-- Pagination -->
    <?php if ($totalPages > 1): ?>
        <div class="pagination">
            <?php
            $queryParams = $_GET;
            for ($i = 1; $i <= $totalPages; $i++) {
                $queryParams['page'] = $i;
                $queryString = http_build_query($queryParams);
                $class = $i === $currentPage ? 'active' : '';
                echo "<a href='?{$queryString}' class='{$class}'>{$i}</a>";
            }
            ?>
        </div>
    <?php endif; ?>
</div>

<!-- Reject Popup-->
<div id="reject-popup" class="orders-popup" style="display: none;">
  <div class="orders-popup-content">
    <h3>Reject Order</h3>
    <form id="reject-form" method="POST" action="/seller/orders/reject">
      <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
      <input type="hidden" name="order_id" id="reject-order-id">
      <div class="form-group">
        <label for="reject-reason">Reason for rejection:</label>
        <textarea id="reject-reason"
                  name="reject_reason"
                  required
                  rows="3"
                  placeholder="Enter reason for rejection"></textarea>
      </div>
      <div class="orders-popup-action">
        <button type="button" onclick="closeModal('reject-popup')">Cancel</button>
        <button type="submit" id="btn-reject">Reject Order</button>
      </div>
    </form>
  </div>
</div>


<!-- Set Delivery Modal -->
<div id="delivery-popup" class="orders-popup" style="display : none">
    <div class="orders-popup-content">
        <h3>Set Delivery Time</h3>
        <form id="delivery-form" method="POST" action="/seller/orders/delivery">
            <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
            <input type="hidden" name="order_id" id="delivery-order-id">
            <div class="form-group">
                <label for="delivery-time">Delivery Date:</label>
                <input type="date" 
                       id="delivery-time" 
                       name="delivery_time" 
                       required
                       min="<?php echo date('Y-m-d'); ?>">
            </div>
            <div class="orders-popup-action">
                <button type="button" onclick="closeModal('delivery-popup')">Cancel</button>
                <button type="submit">Set Delivery</button>
            </div>
        </form>
    </div>
</div>

<!-- Order Detail Modal -->
<div id="detail-popup" class="orders-popup" style="display: none">
    <div class="orders-popup-content">
        <h3>Order Details</h3>
        <div id="order-detail-content">
            Loading...
        </div>
        <div class="orders-popup-action">
            <button type="button" onclick="closeModal('detail-popup')">Close</button>
        </div>
    </div>
</div>
