<?php
require_once __DIR__ . '/../../../services/FeatureFlagService.php';

$user = Auth::user();
$userId = $user ? $user['user_id'] : null;

$restrictions = FeatureFlagService::getDisabledFeatures($userId);
?>

<div class="products-index-main">
    <div class="products-index-container">
        <?php if (!empty($restrictions)): ?>
            <div class="alert-box error" role="alert">
                <strong class="alert-title">System Notice:</strong>
                <ul class="alert-list">
                    <?php foreach ($restrictions as $res): ?>
                        <li>
                            <span class="feature-name"><?= htmlspecialchars($res['feature']) ?>:</span> 
                            <span class="feature-reason"><?= htmlspecialchars($res['reason']) ?></span>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
        <?php
            echo View::component('product-filter', [
                'actionUrl' => $actionUrl ?? '/',
                'categories' => $categories ?? [],
                'filters' => $filters ?? []
            ]);
        ?>

        <div id="product-list-container">
            <?php
            echo View::component('product-list', [
                'productsData' => $productsData,
                'filters' => $filters,
                'actionUrl' => $actionUrl ?? '/'
            ]);
            ?>
        </div>
        
    </div>
</div>