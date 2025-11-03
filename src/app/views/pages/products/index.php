<div class="products-index-main">
    <div class="products-index-container">

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