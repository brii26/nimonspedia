<?php 
$statusClasses = [
    'waiting_approval' => 'warning',
    'approved' => 'info',
    'on_delivery' => 'primary',
    'received' => 'success',
    'rejected' => 'danger'
];
?>

<div class="orders-container">
    <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h3 class="mb-0">Detail Pesanan #<?= View::escape($order['order_id']) ?></h3>
            <span class="status-badge <?= htmlspecialchars($order['status']) ?>">
                <?= ucfirst(str_replace('_', ' ', $order['status'])) ?>
            </span>
        </div>
        <div class="card-body order-detail">
            <div class="row">
                <div class="col-md-6">
                    <div class="section">
                        <h4>Informasi Pesanan</h4>
                        <p><strong>Tanggal Pesan:</strong> <?= View::date($order['created_at']) ?></p>
                        <p><strong>Total:</strong> <?= View::currency($order['total_price']) ?></p>
                        <p><strong>Status:</strong> <?= ucfirst(str_replace('_', ' ', $order['status'])) ?></p>
                        <?php if ($order['status'] === 'rejected'): ?>
                            <?php if (!empty($order['reject_reason'])): ?>
                                <p><strong>Alasan Penolakan:</strong> <?= View::escape($order['reject_reason']) ?></p>
                            <?php endif; ?>

                            <p class="text-danger"><strong>Dana Dikembalikan:</strong> 
                                <span style="font-weight: bold;"><?= View::currency($order['total_price']) ?></span>
                            </p>
                        <?php endif; ?>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="section">
                        <h4>Informasi Toko</h4>
                        <p><strong>Nama Toko:</strong> <?= View::escape($order['store_name']) ?></p>
                        <p><strong>Alamat Pengiriman:</strong><br><?= nl2br(View::escape($order['buyer_address'] ?? '')) ?></p>

                        <?php if ($order['status'] === 'on_delivery' && !empty($order['delivery_time'])): ?>
                            <p><strong>Estimasi Pengiriman:</strong> <?= View::date($order['delivery_time']) ?></p>
                            <?php if (strtotime($order['delivery_time']) <= time()): ?>
                                <form method="POST" action="/orders/confirm">
                                    <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                                    <input type="hidden" name="order_id" value="<?= View::escape($order['order_id']) ?>">
                                    <!-- <button type="submit" class="btn-approve mt-2">Konfirmasi Diterima</button> -->
                                </form>
                            <?php else: ?>
                                <p class="text-muted"><small>Anda dapat mengonfirmasi setelah estimasi pengiriman berlalu.</small></p>
                            <?php endif; ?>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <div class="section mt-4">
                <h4>Item Pesanan</h4>
                <div class="table-responsive-stack">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Produk</th>
                                <th>Harga Satuan</th>
                                <th>Jumlah</th>
                                <th>Subtotal</th>
                                <?php if ($order['status'] === 'received'): ?>
                                <th>Review</th>
                                <?php endif; ?>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($order['items'] as $item): ?>
                                <tr>
                                    <td data-label="Produk">
                                        <div class="order-item-preview">
                                            <img src="/storage/<?= View::escape($item['main_image_path'] ?? 'product_images/default-product.svg') ?>" 
                                                 alt="<?= View::escape($item['product_name']) ?>" 
                                                 class="order-item-thumbnail">
                                            <div class="order-item-info">
                                                <a href="/product?id=<?= $item['product_id'] ?>" class="order-item-name" style="text-decoration: none; color: #34495e;">
                                                    <?= View::escape($item['product_name']) ?>
                                                </a>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td data-label="Harga Satuan"><?= View::currency($item['price_at_order']) ?></td>
                                    
                                    <td data-label="Jumlah"><?= View::escape($item['quantity']) ?></td>
                                    
                                    <td data-label="Subtotal"><?= View::currency($item['subtotal']) ?></td>
                                    
                                    <?php if ($order['status'] === 'received'): ?>
                                    <td data-label="Review">
                                        <a href="/reviews/create?order_id=<?= View::escape($order['order_id']) ?>&product_id=<?= View::escape($item['product_id']) ?>" 
                                           class="btn btn-sm btn-outline-primary">
                                            Write Review
                                        </a>
                                    </td>
                                    <?php endif; ?>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="<?= $order['status'] === 'received' ? '4' : '3' ?>" class="text-end"><strong>Total:</strong></td>
                                <td data-label="Total"><strong><?= View::currency($order['total_price']) ?></strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div class="text-center mb-4">
        <a href="/orders" class="btn btn-outline-primary">Kembali ke Daftar Pesanan</a>
    </div>
</div>