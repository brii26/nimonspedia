<div class="container mt-4">

    <div class="card mb-4 store-header-card">
        
        <a href="javascript:history.back()" class="store-header-back-link">
            &larr; Kembali
        </a>
    
        <div class="store-header-content">
            <img src="<?= '/storage/' . View::escape($store['store_logo_path'] ?? 'path/to/default-logo.png') ?>" 
                 alt="<?= View::escape($store['store_name']) ?> Logo" 
                 class="store-header-logo">
            
            <div class="store-header-info">
                <h1><?= View::escape($store['store_name']) ?></h1>
                <div class="description"><?= $store['store_description'] ?? '<i>Toko ini belum memiliki deskripsi.</i>' ?></div>
            </div>
        </div>
    </div>
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h3>Products from this Store</h3>
        </div>

    <?php if (empty($productsData['data'])): ?>
        <div class="alert alert-info">
            Toko ini belum memiliki produk.
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
                                <small>Toko: 
                                    <a href="/store?id=<?= View::escape($product['store_id']) ?>">
                                        <?= View::escape($product['store_name']) ?>
                                    </a>
                                </small>
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