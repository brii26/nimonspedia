<div class="container">
    <h1 class="mb-4">Shopping Cart</h1>

    <?php if (!empty($error)): ?>
        <div class="alert alert-danger"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <?php if (empty($groupedCart)): ?>
        <div class="cart-empty">
            <p>Your cart is empty.</p>
            <a href="/" class="btn btn-primary">Start Shopping</a>
        </div>
    <?php else: ?>
        
        <form method="post" action="/cart/update" id="cartForm"
              data-csrf-token="<?= htmlspecialchars($csrf_token ?? '') ?>">
            
            <div class="cart-main-content">
                <?php foreach ($groupedCart as $storeName => $storeData): ?>
                    <div class="cart-store-card" data-store-id="<?= (int)($storeData['store_id'] ?? 0) ?>">
                        
                        <div class="cart-store-header">
                            <?= htmlspecialchars($storeName) ?>
                        </div>

                        <div class="cart-item-list">
                            <?php foreach ($storeData['items'] as $it): ?>
                                <div class="cart-item" data-product-id="<?= (int)($it['product_id'] ?? 0) ?>">
                                    
                                    <a href="/product?id=<?= (int)($it['product_id'] ?? 0) ?>">
                                        <img src="<?= '/storage/' . View::escape(!empty($it['product_image']) ? $it['product_image'] : 'product_images/default-product.svg') ?>" 
                                            alt="<?= View::escape($it['product_name']) ?>" 
                                            class="cart-item-image"> </a>

                                    <div class="cart-item-details"> <a href="/product?id=<?= (int)($it['product_id'] ?? 0) ?>" class="cart-product-name">
                                            <?= htmlspecialchars($it['product_name'] ?? '') ?>
                                        </a>
                                        <div class="cart-product-price">
                                            Rp <?= number_format($it['product_price'] ?? 0, 0, ',', '.') ?>
                                        </div>
                                        <div class="item-subtotal-mobile">
                                            Subtotal: <strong>Rp <?= number_format($it['subtotal'] ?? (($it['product_price'] ?? 0) * ($it['quantity'] ?? 0)), 0, ',', '.') ?></strong>
                                        </div>
                                    </div>

                                    <div class="cart-item-actions"> <button type="button" aria-label="Remove product" 
                                    class="btn-remove" data-product-id="<?= (int)($it['product_id'] ?? 0)?>">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M3 6h18"></path>
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                        
                                        <div class="quantity-selector">
                                            
                                            <?php
                                                $currentQty = (int)($it['quantity'] ?? 1);
                                                $maxStock = (int)($it['product_stock'] ?? 999);
                                                $minQty = 1; // Atur minimum quantity di sini
                                            ?>

                                            <button type="button" class="btn-qty btn-qty-minus" aria-label="Decrease quantity" 
                                                <?= $currentQty <= $minQty ? 'disabled' : '' ?>
                                            >-</button>
                                            
                                            <input type="number" class="cart-quantity"  aria-label = "Current quantity"
                                                value="<?= $currentQty ?>" 
                                                min="<?= $minQty ?>" max="<?= $maxStock ?>"
                                                data-previous-value="<?= $currentQty ?>">
                                            
                                            <button type="button" class="btn-qty btn-qty-plus" aria-label="Increase quantity" 
                                                <?= $currentQty >= $maxStock ? 'disabled' : '' ?>
                                            >+</button>
                                        </div>

                                        <div class="item-subtotal-desktop">
                                            Rp <?= number_format($it['subtotal'] ?? (($it['product_price'] ?? 0) * ($it['quantity'] ?? 0)), 0, ',', '.') ?>
                                        </div>
                                    </div>

                                </div>
                            <?php endforeach; // Akhir loop item ?>
                        </div>

                        <div class="cart-store-footer">
                            <span>Subtotal Store:</span>
                            <strong class="store-subtotal">
                                Rp <?= number_format($storeData['subtotal'], 0, ',', '.') ?>
                            </strong>
                        </div>

                    </div> 
                <?php endforeach; // Akhir loop toko ?>
            </div>
            <div class="cart-summary-card">
                <div class="summary-total-group">
                    <span>Total:</span>
                    <h3 class="grand-total" id="grand-total-display">
                        Rp <?= number_format($total, 0, ',', '.') ?>
                    </h3>
                </div>

                <div class="cart-actions">
                    <button type="button" id="updateCart" class="btn-update">Update Cart</button>
                    
                    <a href="/" class="btn btn-secondary btn-continue-shopping">Continue Shopping</a>
                    
                    <a href="/checkout" class="btn btn-success btn-checkout">Checkout</a>
                </div>
            </div>

            </div>

        </form>
    <?php endif; ?>

</div>