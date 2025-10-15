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
                                <a href="#" class="btn btn-primary btn-sm w-100">Add to Cart</a>
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
</body>
</html>