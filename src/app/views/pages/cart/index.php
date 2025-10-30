<?php
// $cart is expected: ['items' => [...], 'total' => int]
$items = $cart['items'] ?? [];
$total = $cart['total'] ?? 0;
?>

<h1>Keranjang Belanja</h1>

<?php if (!empty($error)): ?>
    <div class="alert alert-danger"><?= htmlspecialchars($error) ?></div>
<?php endif; ?>

<?php if (empty($items)): ?>
    <p>Keranjang Anda kosong.</p>
<?php else: ?>
    <form method="post" action="/cart/update">
        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">
        <table class="table">
            <thead>
                <tr>
                    <th>Produk</th>
                    <th>Harga</th>
                    <th>Jumlah</th>
                    <th>Subtotal</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($items as $it): ?>
                    <tr>
                        <td><?= htmlspecialchars($it['product_name'] ?? '') ?></td>
                        <td>Rp <?= number_format($it['product_price'] ?? 0, 0, ',', '.') ?></td>
                        <td>
                            <input type="hidden" name="product_id" value="<?= (int)($it['product_id'] ?? $it['product_id']) ?>">
                            <input type="number" name="quantity" value="<?= (int)$it['quantity'] ?>" min="0" class="form-control" style="width:80px; display:inline-block;">
                        </td>
                        <td>Rp <?= number_format($it['subtotal'] ?? (($it['product_price'] ?? 0) * ($it['quantity'] ?? 0)), 0, ',', '.') ?></td>
                        <td>
                            <form method="post" action="/cart/remove" style="display:inline-block;">
                                <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">
                                <input type="hidden" name="product_id" value="<?= (int)($it['product_id'] ?? 0) ?>">
                                <button type="submit" class="btn btn-danger">Hapus</button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <div style="margin-top:1rem">
            <button type="submit" class="btn btn-primary">Update Keranjang</button>
            <a href="/checkout" class="btn btn-success">Lanjut ke Checkout</a>
        </div>
    </form>

    <h3>Total: Rp <?= number_format($total, 0, ',', '.') ?></h3>
<?php endif; ?>
