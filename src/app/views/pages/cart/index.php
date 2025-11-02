<?php
$items = $cart['items'] ?? [];
$total = $cart['total'] ?? 0;
?>

<div class="container">
    <h1 class="mb-4">Keranjang Belanja</h1>

    <?php if (!empty($error)): ?>
        <div class="alert alert-danger"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <?php if (empty($items)): ?>
        <div class="cart-empty">
            <p>Keranjang Anda kosong.</p>
            <a href="/" class="btn btn-primary">Mulai Belanja</a>
        </div>
    <?php else: ?>
        <form method="post" action="/cart/update" id="cartForm">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">
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
                    <?php foreach ($items as $it): ?>
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
                    <?php endforeach; ?>
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

        <script>
        document.addEventListener('DOMContentLoaded', function() {
            const csrfToken = '<?= htmlspecialchars($csrf_token) ?>';
            
            // Update quantity
            document.getElementById('updateCart').addEventListener('click', function() {
                const items = document.querySelectorAll('.cart-item');
                let completedUpdates = 0;
                const totalUpdates = items.length;
                
                items.forEach(item => {
                    const productId = item.dataset.productId;
                    const quantity = item.querySelector('.cart-quantity').value;
                    
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', '/cart/update', true);
                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    
                    xhr.onload = function() {
                        completedUpdates++;
                        if (completedUpdates === totalUpdates) {
                            window.location.reload();
                        }
                    };
                    
                    xhr.onerror = function() {
                        console.error('Error updating cart');
                        completedUpdates++;
                        if (completedUpdates === totalUpdates) {
                            window.location.reload();
                        }
                    };
                    
                    const data = new URLSearchParams({
                        csrf_token: csrfToken,
                        product_id: productId,
                        quantity: quantity
                    }).toString();
                    
                    xhr.send(data);
                });
            });

            // Remove item
            document.querySelectorAll('.btn-remove').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = this.dataset.productId;
                    const xhr = new XMLHttpRequest();
                    
                    xhr.open('POST', '/cart/remove', true);
                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    
                    xhr.onload = function() {
                        if (xhr.status === 200) {
                            const row = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
                            row.remove();
                            
                            if (document.querySelectorAll('.cart-item').length === 0) {
                                window.location.reload();
                            }
                            updateCartBadge();
                        } else {
                            console.error('Error removing item:', xhr.responseText);
                            alert('Gagal menghapus item dari keranjang');
                        }
                    };
                    
                    xhr.onerror = function() {
                        console.error('Error removing item');
                        alert('Gagal menghapus item dari keranjang');
                    };
                    
                    const data = new URLSearchParams({
                        csrf_token: csrfToken,
                        product_id: productId
                    }).toString();
                    
                    xhr.send(data);
                });
            });

            // Update cart badge
            function updateCartBadge() {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', '/api/cart/count', true);
                
                xhr.onload = function() {
                    if (xhr.status === 200) {
                        const data = JSON.parse(xhr.responseText);
                        const badge = document.querySelector('.cart-badge');
                        if (badge && data.unique > 0) {
                            badge.textContent = data.unique;
                            badge.style.display = 'flex';
                        } else if (badge) {
                            badge.style.display = 'none';
                        }
                    }
                };
                
                xhr.onerror = function() {
                    console.error('Error updating cart badge');
                };
                
                xhr.send();
            }

            // Call initially and after cart changes
            updateCartBadge();
        });
        </script>
    <?php endif; ?>
