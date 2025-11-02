<?php
    $items       = $productsData['data'] ?? [];
    $hasItems    = !empty($items);
    $current     = (int)($productsData['current_page'] ?? 1);
    $totalPages  = (int)($productsData['total_pages'] ?? 1);
    $searchVal   = $_GET['searchTerm'] ?? '';
    $catVal      = $_GET['categoryId'] ?? '';
    $sortVal     = $_GET['sortBy'] ?? '';
    $perPageVal  = (int)($_GET['perPage'] ?? 8);
?>

<div class="seller-product-page">

  <header class="product-page-header">
    <h1>Your Products</h1>
    <a id="add-product-btn" href="/seller/products/create" class="btn btn-success">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      <span><?= $hasItems ? 'Add New Product' : 'Create First Product' ?></span>
    </a>
  </header>

  <aside class="product-filters">
    <form id="product-filter-form" method="GET" action="/seller/products">
      <h5>Filters</h5>

      <div class="filter-group">
        <label for="search-input">Search</label>
        <input type="search" id="search-input" name="searchTerm" class="form-control"
               placeholder="Search product name..." value="<?= View::escape($searchVal) ?>">
      </div>

      <div class="filter-group">
        <label for="filter-category">Category</label>
        <select id="filter-category" name="categoryId" class="form-select">
          <option value="">All Categories</option>
          <?php foreach ($categories as $cat): ?>
            <option value="<?= $cat['category_id'] ?>" <?= ($catVal == $cat['category_id']) ? 'selected' : '' ?>>
              <?= View::escape($cat['name']) ?>
            </option>
          <?php endforeach; ?>
        </select>
      </div>

      <div class="filter-group">
        <label for="sort-select">Sort By</label>
        <select id="sort-select" name="sortBy" class="form-select">
          <option value="">Sort By</option>
          <option value="name"  <?= ($sortVal === 'name')  ? 'selected' : '' ?>>Name</option>
          <option value="price" <?= ($sortVal === 'price') ? 'selected' : '' ?>>Price</option>
          <option value="stock" <?= ($sortVal === 'stock') ? 'selected' : '' ?>>Stock</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-perPage">Per Page</label>
        <select id="filter-perPage" name="perPage" class="form-select">
          <?php foreach ([4, 8, 12, 20] as $opt): ?>
            <option value="<?= $opt ?>" <?= ($perPageVal === $opt) ? 'selected' : '' ?>>
              <?= $opt ?> items
            </option>
          <?php endforeach; ?>
        </select>
      </div>
      
      <button type="button" id="reset-filter-btn" class="btn btn-outline-secondary">Reset Filter</button>
    
    </form>
  </aside>

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
              
              $path = $product['main_image_path'] ?? 'product_images/default-product.png';
              $imageUrl = '/storage/' . View::escape($path);
            ?>

            <div class="card-image">
              <img src="<?= $imageUrl ?>" alt="<?= View::escape($product['product_name']) ?>">
              <span class="stock-badge <?= $stockClass ?>"><?= $stockText ?></span>
            </div>

            <div class="card-body">
              <h3 class="card-title"><?= View::escape($product['product_name']) ?></h3>
              <p class="card-price"><?= View::currency($product['price']) ?></p>
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
    
    <button type="button" class="btn go-back mt-3">Back</button>
  </main>
</div>