<div class="container">
    <h1 class="mb-4">Checkout</h1>

    <form action="checkout" method="POST" id="checkoutForm">
        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token ?? '') ?>">

        <div class="checkout-card">
            <div class="checkout-card-header">
                Alamat Pengiriman
            </div>
            <div class="checkout-card-body address-details">
                <strong><?= htmlspecialchars($user['name'] ?? 'Pengguna') ?></strong>
                <p><?= nl2br(htmlspecialchars($user['address'] ?? 'Alamat belum diatur.')) ?></p>
                </div>
        </div>

        <?php foreach ($groupedCart as $storeName => $storeData): ?>
            <div class="checkout-card">
                <div class="checkout-card-header">
                    Pesanan dari: <strong><?= htmlspecialchars($storeName) ?></strong>
                </div>
                
                <table class="cart-items-table checkout-items-table">
                    <thead>
                        <tr>
                            <th style="width: 50%;">Produk</th>
                            <th style="width: 15%;">Jumlah</th>
                            <th style="width: 20%;">Harga Satuan</th>
                            <th style="width: 15%;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($storeData['items'] as $it): ?>
                            <tr class="cart-item">
                                <td>
                                    <div class="cart-product">
                                        <img src="<?= htmlspecialchars($it['product_image'] ?? '/assets/images/product_placeholder.png') ?>" 
                                             alt="<?= htmlspecialchars($it['product_name'] ?? '') ?>" 
                                             class="cart-product-image">
                                        <div class="cart-product-info">
                                            <span class="cart-product-name">
                                                <?= htmlspecialchars($it['product_name'] ?? '') ?>
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td>x<?= (int)($it['quantity'] ?? 0) ?></td>
                                <td class="cart-product-price">
                                    Rp <?= number_format($it['product_price'] ?? 0, 0, ',', '.') ?>
                                </td>
                                <td class="cart-product-price">
                                    Rp <?= number_format($it['subtotal'] ?? 0, 0, ',', '.') ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                
                <div class="cart-store-footer">
                    <span>Total Toko:</span>
                    <strong>Rp <?= number_format($storeData['subtotal'], 0, ',', '.') ?></strong>
                </div>
            </div>
        <?php endforeach; ?>

        <div class="checkout-summary-card">
            <div class="checkout-card-header">
                Konfirmasi Pembayaran
            </div>
            
            <div class="checkout-card-body payment-summary">
                <ul>
                    <li>
                        <span>Saldo Anda</span>
                        <span>Rp <?= number_format($user['balance'] ?? 0, 0, ',', '.') ?></span>
                    </li>
                    <li>
                        <span>Total Belanja</span>
                        <span class="grand-total">- Rp <?= number_format($grandTotal, 0, ',', '.') ?></span>
                    </li>
                    
                    <?php if ($sisaSaldo < 0): ?>
                        <li class="saldo-kurang">
                            <span>Saldo Tidak Cukup</span>
                            <span>Rp <?= number_format($sisaSaldo, 0, ',', '.') ?></span>
                        </li>
                    <?php else: ?>
                        <li class="sisa-saldo">
                            <span>Sisa Saldo</span>
                            <strong>Rp <?= number_format($sisaSaldo, 0, ',', '.') ?></strong>
                        </li>
                    <?php endif; ?>
                </ul>
            </div>
            
            <div class="checkout-action">
                <button type="submit" class="btn-checkout" <?= ($sisaSaldo < 0) ? 'disabled' : '' ?>>
                    <?= ($sisaSaldo < 0) ? 'Saldo Tidak Cukup' : 'Bayar Sekarang' ?>
                </button>
                <?php if ($sisaSaldo < 0): ?>
                    <a href="/profile#balance" class="btn-top-up">Top Up Saldo</a>
                <?php endif; ?>
            </div>
        </div>

    </form>
     <?= View::component('confirm-modal') ?>
   
</div>