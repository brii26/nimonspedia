<?php
$description = $store['store_description'] ?? null;
$desc_placeholder = empty(trim(strip_tags($description))) ? 'placeholder' : '';
?>

<div class="store-detail-main">
    <div class="store-detail-container">
        
        <section class="store-header-card">
            
            <div class="store-header-content">
                
                <a href="javascript:history.back()" class="store-header-back-link">Kembali</a>

                <div class="store-header-main">
                    <img src="<?= '/storage/' . View::escape($store['store_logo_path'] ?? 'images/default-store.png') ?>" 
                         alt="<?= View::escape($store['store_name']) ?> Logo" 
                         class="store-header-logo">
                    
                    <div class="store-header-info">
                        <h1><?= View::escape($store['store_name']) ?></h1>
                        <p class="description <?= $desc_placeholder ?>">
                            <?= $description ?? '<i>Toko ini belum memiliki deskripsi.</i>' ?>
                        </p>
                    </div>
                </div>
                
                <div class="store-stats">
                    <div class="store-stat">
                        <div class="store-stat-icon">🛍️</div>
                        <div class="store-stat-content">
                            <p class="store-stat-label">Total Produk</p>
                            <p class="store-stat-value"><?= View::escape($productsData['total']) ?></p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="store-products-section">
            <header class="store-products-header">
                <h2>Semua Produk (<?= View::escape($productsData['total']) ?>)</h2>
            </header>
            
            <div class="store-products-content">
                <?php
                echo View::component('product-filter', [
                    'actionUrl' => '/store',
                    'categories' => $categories ?? [],
                    'filters' => $filters ?? [],
                    'extraHiddenFields' => ['id' => $store['store_id']] // <-- PENTING
                ]);
                ?>
                <?php if (empty($productsData['data'])): ?>
                    <div class="store-empty-state">
                        <h3>Tidak Ada Produk</h3>
                        <p>Toko ini belum memiliki produk untuk dijual.</p>
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
                                $baseUrl = "/store?" . $baseQuery;
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
        </section>

    </div>
</div>