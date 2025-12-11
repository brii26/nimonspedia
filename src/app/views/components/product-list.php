<?php
require_once __DIR__ . '/../../services/FeatureFlagService.php';
$products = $productsData['data'] ?? [];

$user = Auth::user();
$userId = $user ? $user['user_id'] : null;

$checkoutAccess = FeatureFlagService::checkAccess($userId, 'checkout_enabled');
?>

<?php if (empty($products)): ?>
    <div class="products-empty-state">
        <h3>Tidak ada produk ditemukan.</h3>
        <p>Coba sesuaikan pencarian atau filter Anda.</p>
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
                    
                    <a href="/store?id=<?= View::escape($product['store_id']) ?>" class="product-store-link">
                        <?= View::escape($product['store_name']) ?>
                    </a>

                    <p class="product-price"><?= View::currency($product['price']) ?></p>
                    
                    <form class="add-to-cart-listing" data-product-id="<?= View::escape($product['product_id']) ?>">
                        <input type="hidden" name="product_id" value="<?= View::escape($product['product_id']) ?>">
                        <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                        <input type="hidden" name="quantity" value="1">
                        <?php if (Auth::check() && $checkoutAccess['allowed']):?>
                            <button type="submit" class= "btn <?= (($product['stock'] > 0) ? " btn-primary" : "") ?>"  
                            style="width: 100%;" <?= ($product['stock'] <= 0) ? 'disabled' : '' ?> >
                                <?= ($product['stock'] > 0) ? 'Add to Cart' : 'Out of Stock' ?>
                            </button>
                        <?php endif; ?>
                    </form>
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

                for ($i = 1; $i <= $totalPages; $i++):
                    $showNumber = false;
                    if ($i == 1 || $i == $totalPages) $showNumber = true;
                    elseif ($i >= $currentPage - $window && $i <= $currentPage + $window) $showNumber = true;
                    
                    if ($showNumber):
                        if ($i > $lastNum + 1):
                ?>
                            <span class="pagination-item disabled" style="border: none; background: none; color: var(--gray-700);">...</span>
                <?php
                        endif;
                        $isActive = ($i == $currentPage) ? 'active' : '';
                ?>
                        <a href="<?= $baseUrl ?>&page=<?= $i ?>" class="pagination-item <?= $isActive ?>"><?= $i ?></a>
                <?php
                        $lastNum = $i;
                    endif;
                endfor;
                ?>
            </div>
        </nav>
    <?php endif; ?>
    
<?php endif; ?>