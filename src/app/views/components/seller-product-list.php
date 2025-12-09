<main class="product-grid-container">
    
  <?php if ($hasItems): ?>
    <div class="product-grid" id="products-body">
      <?php foreach ($items as $product): ?>
        <div class="product-card">
          <?php
            $stock = (int)$product['stock'];
            $stockClass = 'in-stock';
            $stockText = "In Stock: $stock";
            if ($stock === 0) {
              $stockClass = 'out-of-stock';
              $stockText = 'Out of Stock';
            } elseif ($stock <= 10) {
              $stockClass = 'low-stock';
              $stockText = "Low Stock: $stock";
            }
            
            $path = $product['main_image_path'] ?? 'product_images/default-product.svg';
            $imageUrl = '/storage/' . View::escape($path);
          ?>

          <div class="card-image">
            <img src="<?= $imageUrl ?>" alt="<?= View::escape($product['product_name']) ?>">
            <span class="stock-badge <?= $stockClass ?>"><?= $stockText ?></span>
          </div>

          <div class="card-body">
              <h3 class="card-title"><?= View::escape($product['product_name']) ?></h3>
              <p class="card-price"><?= View::currency($product['price']) ?></p>

          <?php
              $allCategories = explode('|||', $product['category_names']);
              $categories = array_filter($allCategories, 'trim'); 
              $categoryCount = count($categories);
              $maxToShow = 2;
          ?>

          <?php if ($categoryCount > 0): ?>
          <div class="card-categories">
              <?php
                  $categoriesToShow = array_slice($categories, 0, $maxToShow);
                  foreach ($categoriesToShow as $categoryName):
              ?>
                  <span class="category-pill">
                  <?= View::escape($categoryName) ?>
                  </span>
              <?php endforeach; ?>
              
              <?php
                  if ($categoryCount > $maxToShow):
                      $remainingCount = $categoryCount - $maxToShow;
              ?>
                  <span class="category-pill more-pill">
                      +<?= $remainingCount ?>
                  </span>
              <?php endif; ?>

          </div>
          <?php endif; ?>

          </div>

          <div class="card-actions">
            <a href="/seller/products/edit?id=<?= $product['product_id'] ?>" class="btn btn-warning">Edit</a>
            <form action="/seller/products/delete" method="POST">
              <input type="hidden" name="product_id" value="<?= $product['product_id'] ?>">
              <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
              <button type="submit" class="btn btn-danger" id="delete-button">Delete</button>
            </form>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
    
    <?php if ($totalPages > 1): ?>
      <nav class="pagination" id="products-pagination">
        <?php
          $queryParams = $_GET;
          
          // Previous button
          if ($current > 1):
            $queryParams['page'] = $current - 1;
            $qs = http_build_query($queryParams);
            echo "<a href='?{$qs}' class='page-arrow'>&laquo;</a>";
          endif;
          
          // Calculate which pages to show
          $showPages = [];
          $showPages[] = 1; // Always show first page
          
          // Pages around current
          for ($i = max(2, $current - 2); $i <= min($totalPages - 1, $current + 2); $i++) {
            $showPages[] = $i;
          }
          
          if ($totalPages > 1) {
            $showPages[] = $totalPages; // Always show last page
          }
          
          $showPages = array_unique($showPages);
          sort($showPages);
          
          $lastShown = 0;
          foreach ($showPages as $page):
            // Add ellipsis if there's a gap
            if ($lastShown && $page - $lastShown > 1):
              echo "<span class='page-ellipsis'>...</span>";
            endif;
            
            $queryParams['page'] = $page;
            $qs = http_build_query($queryParams);
            $active = $page === $current ? 'active' : '';
            echo "<a href='?{$qs}' class='{$active}'>{$page}</a>";
            $lastShown = $page;
          endforeach;
          
          // Next button
          if ($current < $totalPages):
            $queryParams['page'] = $current + 1;
            $qs = http_build_query($queryParams);
            echo "<a href='?{$qs}' class='page-arrow'>&raquo;</a>";
          endif;
        ?>
      </nav>
    <?php endif; ?>

  <?php else: ?>
    <div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
      <h3>No products found</h3>
      <p>Your search or filter criteria didn't match any products.</p>
      <a href="/seller/products" class="btn btn-outline-secondary">Clear Filters</a>
    </div>
  <?php endif; ?>

</main>