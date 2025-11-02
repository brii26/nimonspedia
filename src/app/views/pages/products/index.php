<div class="products-index-main">
    <div class="products-index-container">

        <?php
        // Filter tetap di sini
        echo View::component('product-filter', [
            'actionUrl' => $actionUrl ?? '/',
            'categories' => $categories ?? [],
            'filters' => $filters ?? []
        ]);
        ?>

        <div id="product-list-container">
            <?php
            echo View::render('components/product-list', [
                'productsData' => $productsData,
                'filters' => $filters,
                'actionUrl' => $actionUrl ?? '/'
            ]);
            ?>
        </div>
        
    </div>
</div><?php
echo View::component('cart-success-modal', ['recommendations' => []]);
?>