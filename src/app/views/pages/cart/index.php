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
            <a href="/products" class="btn btn-primary">Mulai Belanja</a>
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
                <a href="/products" class="btn btn-outline-primary">Lanjutkan Belanja</a>
            </div>
        </form>

        <script>
        document.addEventListener('DOMContentLoaded', function() {
            const csrfToken = '<?= htmlspecialchars($csrf_token) ?>';
            
            // Update quantity
            document.getElementById('updateCart').addEventListener('click', async function() {
                const items = document.querySelectorAll('.cart-item');
                const updates = [];

                items.forEach(item => {
                    const productId = item.dataset.productId;
                    const quantity = item.querySelector('.cart-quantity').value;
                    updates.push({ productId, quantity });
                });

                for (const update of updates) {
                    try {
                        const response = await fetch('/cart/update', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            body: new URLSearchParams({
                                csrf_token: csrfToken,
                                product_id: update.productId,
                                quantity: update.quantity
                            })
                        });

                        if (!response.ok) {
                            throw new Error('Failed to update cart');
                        }
                    } catch (error) {
                        console.error('Error updating cart:', error);
                    }
                }

                // Reload page to show updated cart
                window.location.reload();
            });

            // Remove item
            document.querySelectorAll('.btn-remove').forEach(button => {
                button.addEventListener('click', async function() {
                    const productId = this.dataset.productId;
                    
                    try {
                        const response = await fetch('/cart/remove', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            body: new URLSearchParams({
                                csrf_token: csrfToken,
                                product_id: productId
                            })
                        });

                        if (!response.ok) {
                            throw new Error('Failed to remove item');
                        }

                        // Remove the row from UI
                        const row = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
                        row.remove();

                        // If cart is empty, reload to show empty state
                        if (document.querySelectorAll('.cart-item').length === 0) {
                            window.location.reload();
                        }
                    } catch (error) {
                        console.error('Error removing item:', error);
                        alert('Gagal menghapus item dari keranjang');
                    }
                });
            });

            // Update cart badge
            async function updateCartBadge() {
                try {
                    const response = await fetch('/api/cart/count');
                    if (response.ok) {
                        const data = await response.json();
                        const badge = document.querySelector('.cart-badge');
                        if (badge && data.unique > 0) {
                            badge.textContent = data.unique;
                            badge.style.display = 'flex';
                        } else if (badge) {
                            badge.style.display = 'none';
                        }
                    }
                } catch (error) {
                    console.error('Error updating cart badge:', error);
                }
            }

            // Call initially and after cart changes
            updateCartBadge();
        });
        </script>
    <?php endif; ?>
