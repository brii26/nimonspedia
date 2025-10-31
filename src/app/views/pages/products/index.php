<div class="products-index-main">
    <div class="products-index-container">

        <div class="products-header-card">
            <h2>All Products</h2>
            </div>

        <?php if (empty($productsData['data'])): ?>
            <div class="products-empty-state">
                <h3>No products found.</h3>
                <p>Try adjusting your search or filters.</p>
            </div>
        <?php else: ?>
            <div class="products-grid">
                <?php foreach ($productsData['data'] as $product): ?>
                    
                    <div class="product-card">
                        <a href="/product?id=<?= View::escape($product['product_id']) ?>" class="product-image-link">
                            <img src="<?= '/storage/' . View::escape($product['main_image_path'] ?? 'images/product_placeholder.png') ?>" 
                                 alt="<?= View::escape($product['product_name']) ?>" 
                                 class="product-image">
                        </a>
                        <div class="product-info">
                            <a href="/product?id=<?= View::escape($product['product_id']) ?>" class="product-name-link">
                                <h3 class="product-name"><?= View::escape($product['product_name']) ?></h3>
                            </a>
                            
                            <a href="/store?id=<?= View::escape($product['store_id']) ?>" class="product-store-link">
                                <?= View::escape($product['store_name']) ?>
                            </a>

                            <p class="product-price"><?= View::currency($product['price']) ?></p>
                            
                            <form class="add-to-cart-listing" data-product-id="<?= View::escape($product['product_id']) ?>">
                                <input type="hidden" name="product_id" value="<?= View::escape($product['product_id']) ?>">
                                <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                                <input type="hidden" name="quantity" value="1">
                                <button type="submit" class="btn btn-primary" style="width: 100%;" <?= ($product['stock'] <= 0) ? 'disabled' : '' ?> >
                                    <?= ($product['stock'] > 0) ? 'Add to Cart' : 'Out of Stock' ?>
                                </button>
                            </form>
                        </div>
                    </div>
                    
                <?php endforeach; ?>
            </div>

            <?php if ($productsData['total_pages'] > 1): ?>
                <nav style="margin-top: 2rem;">
                    <ul class="pagination" style="justify-content: center;">
                        <?php 
                        $queryParams = $_GET;
                        unset($queryParams['page']);
                        $baseQuery = http_build_query($queryParams);
                        $baseUrl = "/?" . $baseQuery;
                        ?>
                        <?php for ($i = 1; $i <= $productsData['total_pages']; $i++): ?>
                            <li class="page-item <?= ($i == $productsData['current_page']) ? 'active' : '' ?>">
                                <a class="page-link" href="<?= $baseUrl ?>&page=<?= $i ?>"><?= $i ?></a>
                            </li>
                        <?php endfor; ?>
                    </ul>
                </nav>
            <?php endif; ?>
            
        <?php endif; ?>
    </div>
</div>