<?php
$description = SanitizerService::sanitizeRichText($store['store_description']) ?? null;
$desc_placeholder = empty(trim(strip_tags($description))) ? 'placeholder' : '';
?>

<div class="store-detail-main">
    <div class="store-detail-container">
        
        <section class="store-header-card">
            
            <div class="store-header-content">
                
                <a href="javascript:history.back()" class="store-header-back-link">Kembali</a>

                <div class="store-header-main">
                    <img src="<?= '/storage/' . View::escape($store['store_logo_path'] ?? 'images/default-store.svg') ?>" 
                         alt="<?= View::escape($store['store_name']) ?> Logo" 
                         class="store-header-logo">
                    
                    <div class="store-header-info">
                        <h1><?= View::escape($store['store_name']) ?></h1>
                        <p class="description <?= $desc_placeholder ?>">
                            <?= $description ?? '<i>This store has no description yet.</i>' ?>
                        </p>
                    </div>
                </div>
                
                <div class="store-stats">
                    <div class="store-stat">
                        <div class="store-stat-icon">🛍️</div>
                        <div class="store-stat-content">
                            <p class="store-stat-label">Total Products</p>
                            <p class="store-stat-value"><?= View::escape($productsData['total']) ?></p>
                        </div>
                    </div>
                </div>

                <?php if (Auth::check()): ?>
                    <?php 
                    $user = Auth::user();
                    if ($user && $user['role'] === 'BUYER'): 
                    ?>
                        <div style="margin-top: 1.5rem;">
                            <?php
                            echo View::component('chat-button', [
                                'storeId' => $store['store_id'],
                                'storeName' => $store['store_name'],
                                'variant' => 'primary',
                                'size' => 'md',
                                'fullWidth' => false
                            ]);
                            ?>
                        </div>
                    <?php endif; ?>
                <?php endif; ?>
            </div>
        </section>

        <section class="store-products-section">
            <header class="store-products-header">
                <h2>All Products (<?= View::escape($productsData['total']) ?>)</h2>
            </header>
            
            <div class="store-products-content">
                <?php
                echo View::component('product-filter', [
                    'actionUrl' => $actionUrl ?? '/store',
                    'categories' => $categories ?? [],
                    'filters' => $filters ?? [],
                    'extraHiddenFields' => ['id' => $store['store_id']]
                ]);
                ?>
                
                <div id="product-list-container">
                     <?php
                    echo View::render('components/product-list', [
                        'productsData' => $productsData,
                        'filters' => $filters,
                        'actionUrl' => $actionUrl ?? '/store',
                        'extraHiddenFields' => ['id' => $store['store_id']]
                    ]);
                    ?>
                </div>

            </div>
        </section>

    </div>
</div>