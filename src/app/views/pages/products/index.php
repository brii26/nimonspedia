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
                                    <a href="?id=<?= View::escape($product['product_id']) ?>">
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
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <small class="text-muted">
                        <?php
                            $total = $productsData['total'] ?? 0;
                            $perPage = $productsData['per_page'] ?? 8;
                            $current = $productsData['current_page'] ?? 1;
                            $start = ($total === 0) ? 0 : (($current - 1) * $perPage) + 1;
                            $end = min($total, $current * $perPage);
                        ?>
                        Menampilkan <?= $start ?> - <?= $end ?> dari <?= $total ?> produk
                    </small>
                    <ul class="pagination mb-0">
                        <?php
                            $baseQuery = $_GET ?? [];
                            $totalPages = $productsData['total_pages'] ?? 1;
                            $prev = max(1, $current - 1);
                            $next = min($totalPages, $current + 1);
                        ?>
                        <li class="page-item <?= ($current == 1) ? 'disabled' : '' ?>">
                            <?php $baseQuery['page'] = $prev; $qs = http_build_query($baseQuery); ?>
                            <a class="page-link" href="?<?= $qs ?>">&laquo; Prev</a>
                        </li>

                        <?php for ($i = 1; $i <= $totalPages; $i++): 
                                $baseQuery['page'] = $i;
                                $qs = http_build_query($baseQuery);
                        ?>
                            <li class="page-item <?= ($i == $current) ? 'active' : '' ?>">
                                <a class="page-link" href="?<?= $qs ?>"><?= $i ?></a>
                            </li>
                        <?php endfor; ?>

                        <li class="page-item <?= ($current == $totalPages) ? 'disabled' : '' ?>">
                            <?php $baseQuery['page'] = $next; $qs = http_build_query($baseQuery); ?>
                            <a class="page-link" href="?<?= $qs ?>">Next &raquo;</a>
                        </li>
                    </ul>
                </div>
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