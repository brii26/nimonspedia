<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Browse Products - Nimonspedia</title>
    </head>
<body>
    <?php
        // View::render('partials/navbar'); 
    ?>
    
    <div class="container mt-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3>All Products</h3>
            </div>

        <?php if (empty($productsData['data'])): ?>
            <div class="alert alert-info">
                No products found.
            </div>
        <?php else: ?>
            <div class="row">
                <?php foreach ($productsData['data'] as $product): ?>
                    <div class="col-md-3 mb-4">
                        <div class="card h-100">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <a href="/product?id=<?= View::escape($product['product_id']) ?>">
                                        <?= View::escape($product['product_name']) ?>
                                    </a>
                                </h5>
                                <h6 class="card-subtitle mb-2 text-muted"><?= View::currency($product['price']) ?></h6>
                                <p class="card-text">
                                    <small>Stok: <?= View::escape($product['stock']) ?></small><br>
                                    <small>Toko: <?= View::escape($product['store_name']) ?></small>
                                </p>
                            </div>
                            <div class="card-footer">
                                <form class="add-to-cart-listing" data-product-id="<?= View::escape($product['product_id']) ?>">
                                    <input type="hidden" name="product_id" value="<?= View::escape($product['product_id']) ?>">
                                    <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                                    <input type="hidden" name="quantity" value="1">
                                    <button type="submit" class="btn btn-primary btn-sm w-100" <?= ($product['stock'] <= 0) ? 'disabled' : '' ?> >
                                        <?= ($product['stock'] > 0) ? 'Add to Cart' : 'Out of Stock' ?>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>

            <nav>
                <ul class="pagination justify-content-center">
                    <?php for ($i = 1; $i <= $productsData['total_pages']; $i++): ?>
                        <li class="page-item <?= ($i == $productsData['current_page']) ? 'active' : '' ?>">
                            <a class="page-link" href="/products?page=<?= $i ?>"><?= $i ?></a>
                        </li>
                    <?php endfor; ?>
                </ul>
            </nav>
        <?php endif; ?>
    </div>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.add-to-cart-listing').forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const btn = form.querySelector('button[type="submit"]');
                const originalText = btn.textContent;
                
                btn.disabled = true;
                btn.textContent = 'Adding...';

                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/cart/add', true);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                
                xhr.onload = function() {
                    if (xhr.status === 200) {
                        const result = JSON.parse(xhr.responseText);
                        const badge = document.querySelector('.cart-badge');
                        if (badge && result.data?.uniqueCount) {
                            badge.textContent = result.data.uniqueCount;
                            badge.style.display = 'flex';
                        }
                        
                        btn.textContent = 'Added';
                        setTimeout(() => btn.textContent = originalText, 900);
                    } else {
                        const result = JSON.parse(xhr.responseText);
                        alert(result.error || 'Gagal menambahkan ke keranjang');
                        btn.disabled = false;
                        btn.textContent = originalText;
                    }
                };
                
                xhr.onerror = function() {
                    console.error('Error adding to cart');
                    alert('Gagal menambahkan ke keranjang');
                    btn.disabled = false;
                    btn.textContent = originalText;
                };
                
                xhr.send(new URLSearchParams(new FormData(form)));
            });
        });
    });
    </script>
</body>
</html>