<?php
	$statuses = ['waiting_approval', 'approved', 'on_delivery', 'received', 'rejected'];
	$currentStatus = $currentStatus ?? null;
	$search = $search ?? '';
?>

<div class="orders-container">
    <div class="status-tabs">
        <a href="/seller/orders" class="tab <?php echo !$currentStatus ? 'active' : ''; ?>">All</a>
        <?php foreach ($statuses as $status): ?>
            <a href="/seller/orders?status=<?php echo $status; ?>" 
               class="tab <?php echo $currentStatus === $status ? 'active' : ''; ?>">
                <?php echo ucwords(str_replace('_', ' ', $status)); ?>
            </a>
        <?php endforeach; ?>
    </div>

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
	
    <div id="seller-order-list-container">
        <?= View::component('seller-order-list', [
                'ordersData' => $ordersData,
                'currentStatus' => $currentStatus,
                'currentPage' => $currentPage ?? 1,
                'totalPages' => $totalPages ?? 1
            ]);
        ?>
    </div>
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
