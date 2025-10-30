<?php 
$statusClasses = [
    'pending' => 'warning',
    'processing' => 'info',
    'shipped' => 'primary',
    'delivered' => 'success',
    'cancelled' => 'danger'
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
                    <p><strong>Total:</strong> <?= View::currency($order['total_amount']) ?></p>
                    <p><strong>Status:</strong> <?= ucfirst($order['status']) ?></p>
                    <?php if ($order['delivery_info']): ?>
                        <p><strong>Info Pengiriman:</strong> <?= nl2br(View::escape($order['delivery_info'])) ?></p>
                    <?php endif; ?>
                </div>
                <div class="col-md-6">
                    <h5>Informasi Toko</h5>
                    <p><strong>Nama Toko:</strong> <?= View::escape($order['store_name']) ?></p>
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
                                <td><?= View::currency($item['price']) ?></td>
                                <td><?= View::escape($item['quantity']) ?></td>
                                <td><?= View::currency($item['price'] * $item['quantity']) ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="text-end"><strong>Total:</strong></td>
                            <td><strong><?= View::currency($order['total_amount']) ?></strong></td>
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