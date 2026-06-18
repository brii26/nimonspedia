<?php
require_once __DIR__ . '/../../services/FeatureFlagService.php';
$products = $productsData['data'] ?? [];

$user = Auth::user();
$userId = $user ? $user['user_id'] : null;

$checkoutAccess = FeatureFlagService::checkAccess($userId, 'checkout_enabled');
?>

<?php if (empty($products)): ?>
    <div class="products-empty-state">
        <h3>No products found.</h3>
        <p>Try adjusting your search or filter.</p>
    </div>
<?php else: ?>
    <div class="products-grid">
        <?php foreach ($products as $product): ?>
            
            <div class="product-card">
                <a href="/product?id=<?= View::escape($product['product_id']) ?>" class="product-image-link">
                    <?php 
                        $mainImagePath = $product['main_image_path'] ?? 'product_images/default-product.svg';
                        $previewPath = $mainImagePath;
                        
                        if ($mainImagePath !== 'product_images/default-product.svg') {
                            $pathParts = pathinfo($mainImagePath);
                            if (isset($pathParts['extension'])) {
                                $previewPath = $pathParts['dirname'] . '/' . $pathParts['filename'] . '_preview.' . $pathParts['extension'];
                            }
                        }
                    ?>
                    <img src="<?= '/storage/' . View::escape($previewPath) ?>" 
                         alt="<?= View::escape($product['product_name']) ?>" 
                         class="product-image"
                         loading="lazy"
                         onerror="this.onerror=null;this.src='<?= '/storage/' . View::escape($mainImagePath) ?>';">
                </a>
                <div class="product-info">
                    <a href="/product?id=<?= View::escape($product['product_id']) ?>" class="product-name-link">
                        <h3 class="product-name"><?= View::escape($product['product_name']) ?></h3>
                    </a>
                    <p class="product-price"><?= View::currency($product['price']) ?></p>
                    <a href="/store?id=<?= View::escape($product['store_id']) ?>" class="product-store-link">
                        <?= View::escape($product['store_name']) ?>
                    </a>
                </div>
            </div>
            
        <?php endforeach; ?>
    </div>

    <?php if ($productsData['total_pages'] > 1): ?>
        <nav style="margin-top: 2rem;">
            <div class="pagination" style="justify-content: center;">
                <?php
                $queryParams = $filters ?? [];
                unset($queryParams['page']);
                $baseQuery = http_build_query($queryParams);
                $baseUrl = ($actionUrl ?? '/') . "?" . $baseQuery;

                $currentPage = (int)$productsData['current_page'];
                $totalPages = (int)$productsData['total_pages'];
                $window = 2;
                $lastNum = 0;
                ?>

                <?php if ($currentPage > 1): ?>
                    <a href="<?= $baseUrl ?>&page=<?= $currentPage - 1 ?>" class="pagination-item pagination-prev">&#8592;</a>
                <?php else: ?>
                    <span class="pagination-item pagination-prev disabled">&#8592;</span>
                <?php endif; ?>

                <?php for ($i = 1; $i <= $totalPages; $i++):
                    $show = ($i == 1 || $i == $totalPages || ($i >= $currentPage - $window && $i <= $currentPage + $window));
                    if ($show):
                        if ($i > $lastNum + 1): ?>
                            <span class="pagination-item disabled" style="border:none;background:none;">…</span>
                        <?php endif; ?>
                        <a href="<?= $baseUrl ?>&page=<?= $i ?>" class="pagination-item <?= $i == $currentPage ? 'active' : '' ?>"><?= $i ?></a>
                <?php   $lastNum = $i;
                    endif;
                endfor; ?>

                <?php if ($currentPage < $totalPages): ?>
                    <a href="<?= $baseUrl ?>&page=<?= $currentPage + 1 ?>" class="pagination-item pagination-next">&#8594;</a>
                <?php else: ?>
                    <span class="pagination-item pagination-next disabled">&#8594;</span>
                <?php endif; ?>

            </div>
        </nav>
    <?php endif; ?>
    
<?php endif; ?>