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

            <?php foreach ($groupedCart as $storeName => $storeData): ?>
                
                <div class="cart-store-card">
                    
                    <div class="cart-store-header">
                        <strong><?= htmlspecialchars($storeName) ?></strong>
                    </div>

                    <table class="cart-items-table">
                        <thead>
                            <tr>
                                <th style="width: 40%;">Produk</th>
                                <th style="width: 20%;">Harga</th>
                                <th style="width: 15%;">Jumlah</th>
                                <th style="width: 20%;">Subtotal</th>
                                <th style="width: 5%;"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($storeData['items'] as $it): ?>
                                <tr class="cart-item" data-product-id="<?= (int)($it['product_id'] ?? 0) ?>">
                                    <td>
                                        <div class="cart-product">
                                            
                                            <a href="/product?id=<?= (int)($it['product_id'] ?? 0) ?>">
                                            <img src="<?= '/storage/' . View::escape($it['product_image'] ?? 'product_images/default-product.png') ?>" 
                                                alt="<?= View::escape($it['product_name']) ?>" 
                                                class="product-image">
                                            </a>
                                            
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
                                            min="0" max="<?= (int)($it['product_stock'] ?? 999) ?>">
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
                        </tbody>
                    </table>

                    <div class="cart-store-footer">
                        <span>Subtotal Toko:</span>
                        <strong>Rp <?= number_format($storeData['subtotal'], 0, ',', '.') ?></strong>
                    </div>

                </div> <?php endforeach; // Akhir loop toko ?>

            <div class="cart-summary-card">
                <div class="cart-total">
                    <h3>Total Belanja:</h3>
                    <h3 class="grand-total">Rp <?= number_format($total, 0, ',', '.') ?></h3>
                </div>

                <div class="cart-actions">
                    <button type="button" id="updateCart" class="btn-update">Update Keranjang</button>
                    <a href="/" class="btn-continue-shopping">Lanjutkan Belanja</a>
                    <a href="/checkout" class="btn-checkout">Checkout</a>
                </div>
            </div>

        </form>
    <?php endif; ?>

</div>