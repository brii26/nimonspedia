<?php 
$statusClasses = [
    'waiting_approval' => 'warning',
    'approved' => 'info',
    'on_delivery' => 'primary',
    'received' => 'success',
    'rejected' => 'danger'
];
?>

<div class="container mt-4">
    <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h3 class="mb-0">Detail Pesanan #<?= View::escape($order['order_id']) ?></h3>
            <span class="badge badge-<?= $statusClasses[$order['status']] ?>">
                <?= ucfirst($order['status']) ?>
            </span>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-6">
                    <h5>Informasi Pesanan</h5>
                    <p><strong>Tanggal Pesan:</strong> <?= View::date($order['created_at']) ?></p>
                    <p><strong>Total:</strong> <?= View::currency($order['total_price']) ?></p>
                    <p><strong>Status:</strong> <?= ucfirst(str_replace('_', ' ', $order['status'])) ?></p>
                    <?php if (!empty($order['reject_reason']) && $order['status'] === 'rejected'): ?>
                        <p><strong>Alasan Penolakan:</strong> <?= View::escape($order['reject_reason']) ?></p>
                        <p><strong>Jumlah Dikembalikan:</strong> <?= View::currency($order['total_price']) ?></p>
                    <?php endif; ?>
                </div>
                <div class="col-md-6">
                    <h5>Informasi Toko</h5>
                    <p><strong>Nama Toko:</strong> <?= View::escape($order['store_name']) ?></p>
                    <p><strong>Alamat Pengiriman:</strong><br><?= nl2br(View::escape($order['buyer_address'] ?? '')) ?></p>
                    <?php if ($order['status'] === 'on_delivery' && !empty($order['delivery_time'])): ?>
                        <p><strong>Estimasi Pengiriman:</strong> <?= View::date($order['delivery_time']) ?></p>
                        <?php if (strtotime($order['delivery_time']) <= time()): ?>
                            <form method="POST" action="/orders/confirm">
                                <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                                <input type="hidden" name="order_id" value="<?= View::escape($order['order_id']) ?>">
                                <button type="submit" class="btn btn-success mt-2">Konfirmasi Diterima</button>
                            </form>
                        <?php else: ?>
                            <p class="text-muted"><small>Anda dapat mengonfirmasi setelah estimasi pengiriman berlalu.</small></p>
                        <?php endif; ?>
                    <?php endif; ?>
                </div>
            </div>

            <h5 class="mt-4">Item Pesanan</h5>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Produk</th>
                            <th>Harga Satuan</th>
                            <th>Jumlah</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($order['items'] as $item): ?>
                            <tr>
                                <td>
                                    <a href="/product?id=<?= $item['product_id'] ?>">
                                        <?= View::escape($item['product_name']) ?>
                                    </a>
                                </td>
                                <td><?= View::currency($item['price_at_order']) ?></td>
                                <td><?= View::escape($item['quantity']) ?></td>
                                <td><?= View::currency($item['subtotal']) ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="text-end"><strong>Total:</strong></td>
                            <td><strong><?= View::currency($order['total_price']) ?></strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>

    <div class="text-center mb-4">
        <a href="/orders" class="btn btn-outline-primary">Kembali ke Daftar Pesanan</a>
    </div>
</div>