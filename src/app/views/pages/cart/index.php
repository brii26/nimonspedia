<?php
$items = $cart['items'] ?? [];
$total = $cart['total'] ?? 0;

// --- 1. LOGIKA PENGELOMPOKAN (GROUPING LOGIC) ---
// Buat array baru untuk menampung data yang sudah digrup
$groupedCart = [];
foreach ($items as $it) {
    // Tentukan nama toko, beri default jika tidak ada
    $storeName = $it['store_name'] ?? 'Toko Tidak Dikenal';
    $storeId = $it['store_id'] ?? 0;
    
    // Buat "ember" untuk toko ini jika belum ada
    if (!isset($groupedCart[$storeName])) {
        $groupedCart[$storeName] = [
            'store_id' => $storeId,
            'items' => [] // Buat array untuk item-item di toko ini
        ];
    }
    
    // Masukkan item saat ini ke "ember" tokonya
    $groupedCart[$storeName]['items'][] = $it;
}
?>

<div class="container">
    <h1 class="mb-4">Keranjang Belanja</h1>

    <?php if (!empty($error)): ?>
        <div class="alert alert-danger"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <?php if (empty($groupedCart)): ?>
        <div class="cart-empty">
            <p>Keranjang Anda kosong.</p>
            <a href="/" class="btn btn-primary">Mulai Belanja</a>
        </div>
    <?php else: ?>
        
        <form method="post" action="/cart/update" id="cartForm"
              data-csrf-token="<?= htmlspecialchars($csrf_token ?? '') ?>">

            <table class="cart-table">
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
                    <?php foreach ($groupedCart as $storeName => $storeData): ?>
                        
                        <tr class="store-header">
                            <td colspan="5">
                                <strong><?= htmlspecialchars($storeName) ?></strong>
                                </td>
                        </tr>
                        
                        <?php foreach ($storeData['items'] as $it): ?>
                            <tr class="cart-item" data-product-id="<?= (int)($it['product_id'] ?? 0) ?>">
                                <td>
                                    <div class="cart-product">
                                        <div class="cart-product-info">
                                            <a href="/product?id=<?= (int)($it['product_id'] ?? 0) ?>" class="cart-product-name">
                                                <?= htmlspecialchars($it['product_name'] ?? '') ?>
                                            </a>
                                        </div>
                                    </div>
                                </td>
                                <td class="cart-product-price">
                                    Rp <?= number_format($it['product_price'] ?? 0, 0, ',', '.') ?>
                                </td>
                                <td>
                                    <input type="number" class="cart-quantity" 
                                        value="<?= (int)$it['quantity'] ?>" 
                                        min="0" max="<?= (int)($it['product_stock'] ?? 999) ?>"
                                        data-product-id="<?= (int)($it['product_id'] ?? 0) ?>"
                                        title="Stok tersedia: <?= (int)($it['product_stock'] ?? 'tidak terbatas') ?>">
                                </td>
                                <td class="cart-product-price">
                                    Rp <?= number_format($it['subtotal'] ?? (($it['product_price'] ?? 0) * ($it['quantity'] ?? 0)), 0, ',', '.') ?>
                                </td>
                                <td>
                                    <button type="button" class="btn-remove" data-product-id="<?= (int)($it['product_id'] ?? 0) ?>">
                                        Hapus
                                    </button>
                                </td>
                            </tr>
                        <?php endforeach; // Akhir loop item ?>
                        
                    <?php endforeach; // Akhir loop toko ?>
                </tbody>
                </table>

            <div class="cart-total">
                <h3>Total: Rp <?= number_format($total, 0, ',', '.') ?></h3>
            </div>

            <div class="cart-actions">
                <button type="button" id="updateCart" class="btn-update">Update Keranjang</button>
                <a href="/checkout" class="btn-checkout">Lanjut ke Checkout</a>
                <a href="/" class="btn btn-outline-primary">Lanjutkan Belanja</a>
            </div>
        </form>
    <?php endif; ?>

</div>