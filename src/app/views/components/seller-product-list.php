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
              <?php 
                  $auctionId = $product['auction_id'] ?? null; 
              ?>
              <?php if ($auctionId): ?>
                  <a href="/auction/<?= $auctionId ?>" class="btn btn-info">View Auction</a>
              <?php else: ?>
                  <button type="button" 
                          class="btn btn-primary btn-start-auction"
                          data-product-id="<?= $product['product_id'] ?>"
                          data-product-name="<?= View::escape($product['product_name']) ?>"
                          data-product-stock="<?= $product['stock'] ?>">
                      Begin Auction
                  </button>
              <?php endif; ?>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
    
    <?php if ($totalPages > 1): ?>
      <nav class="pagination" id="products-pagination">
        <?php
          $queryParams = $_GET;
          for ($i = 1; $i <= $totalPages; $i++):
            $queryParams['page'] = $i;
            $qs = http_build_query($queryParams);
            $active = $i === $current ? 'active' : '';
            echo "<a href='?{$qs}' class='{$active}'>{$i}</a>";
          endfor;
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

<!-- Auction Modal -->
<div id="auction-modal" class="app-modal" aria-hidden="true">
    
    <div class="app-modal-backdrop" id="auction-backdrop"></div>
    
    <div class="app-modal-wrapper">
        <div class="app-modal-card">
            
            <div class="app-modal-header">
                <h2>Start Auction: <span id="auction-product-name-display" class="highlight-text"></span></h2>
                <button type="button" class="app-modal-close" id="auction-close-x">&times;</button>
            </div>

            <div class="app-modal-body">
              <form id="auction-form" action="/seller/auctions/create" method="POST">
                  <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                  <input type="hidden" name="product_id" id="auction-product-id">
                  
                  <div class="auction-form-group">
                      <label>Start Time</label>
                      <input type="datetime-local" name="start_time" class="form-control auction-input" required>
                  </div>

                  <div class="auction-form-group">
                      <label>End Time</label>
                      <input type="datetime-local" name="end_time" class="form-control auction-input" required>
                  </div>

                  <div class="auction-form-group">
                      <label>Quantity to Auction <small id="stock-hint"></small></label>
                      <input type="number" name="quantity" id="auction-quantity" min="1" class="form-control auction-input" required>
                  </div>

                  <div class="auction-form-group">
                      <label>Starting Price</label>
                      <input type="number" name="start_price" id="auction-start-price" class="form-control auction-input" required>
                  </div>

                  <div class="auction-form-group">
                      <label>Minimum Bid Increment</label>
                      <input type="number" name="min_increment" placeholder="e.g., 10000" class="form-control auction-input" required>
                  </div>
              </form>
            <div class="app-modal-footer">
                <button type="button" class="btn btn-secondary" id="auction-cancel-btn">Cancel</button>
                <button type="submit" form="auction-form" class="btn btn-primary">Create Auction</button>
            </div>

        </div>
    </div>
</div>