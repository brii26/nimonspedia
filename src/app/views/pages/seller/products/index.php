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
<div class="container mt-4" id="seller-product-list-container">
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h3>Your Products</h3>
    <a id="add-product-btn" href="/seller/products/create" class="btn btn-success">
      <?= $hasItems ? 'Add New Product' : 'Create First Product' ?>
    </a>
  </div>

  <!-- Filter -->
  <form id="product-filter-form" method="GET" action="/seller/products">
    <div class="row g-2 align-items-center">
      <div class="col-md-4">
        <input type="text" id="search-input" name="searchTerm" class="form-control"
               placeholder="Search product name..." value="<?= View::escape($searchVal) ?>">
      </div>

      <div class="col-md-3">
        <select id="filter-category" name="categoryId" class="form-select">
          <option value="">All Categories</option>
          <?php foreach ($categories as $cat): ?>
            <option value="<?= $cat['category_id'] ?>" <?= ($catVal == $cat['category_id']) ? 'selected' : '' ?>>
              <?= View::escape($cat['name']) ?>
            </option>
          <?php endforeach; ?>
        </select>
      </div>

      <div class="col-md-3">
        <select id="sort-select" name="sortBy" class="form-select">
          <option value="">Sort By</option>
          <option value="name"  <?= ($sortVal === 'name')  ? 'selected' : '' ?>>Name</option>
          <option value="price" <?= ($sortVal === 'price') ? 'selected' : '' ?>>Price</option>
          <option value="stock" <?= ($sortVal === 'stock') ? 'selected' : '' ?>>Stock</option>
        </select>
      </div>

      <div class="col-md-2">
        <select id="filter-perPage" name="perPage" class="form-select">
          <?php foreach ([4,8,12,20] as $opt): ?>
            <option value="<?= $opt ?>" <?= ($perPageVal === $opt) ? 'selected' : '' ?>>
              <?= $opt ?> items
            </option>
          <?php endforeach; ?>
        </select>
      </div>
    </div>
  </form>

  <!-- Table -->
  <div class="card mt-3">
    <div class="card-body">
      <table class="table" id="products-table">
        <thead>
          <tr>
            <th>Pict</th><th>Name</th><th>Price</th><th>Stock</th><th>Actions</th>
          </tr>
        </thead>
        <tbody id="products-body">
          <?php if ($hasItems): ?>
            <?php foreach ($items as $product): ?>
              <tr>
                <td>
                  <?php
                    $path = $product['main_image_path'] ?? 'product_images/default-product.png';
                    $imageUrl = '/storage/' . View::escape($path);
                  ?>
                  <img src="<?= $imageUrl ?>" alt="<?= View::escape($product['product_name']) ?>" class="product-thumb">
                </td>
                <td><?= View::escape($product['product_name']) ?></td>
                <td><?= View::currency($product['price']) ?></td>
                <td><?= View::escape($product['stock']) ?></td>
                <td>
                  <a href="/seller/products/edit?id=<?= $product['product_id'] ?>" class="btn btn-sm btn-warning">Edit</a>
                  <form action="/seller/products/delete" method="POST" style="display:inline;">
                    <input type="hidden" name="product_id" value="<?= $product['product_id'] ?>">
                    <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                    <button type="submit" class="btn btn-sm btn-danger" id="delete-button">Delete</button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          <?php else: ?>
            <tr><td colspan="5" class="text-center text-muted">No products found.</td></tr>
          <?php endif; ?>
        </tbody>
      </table>

      <!-- Pagination -->
      <?php if ($totalPages > 1): ?>
        <div class="pagination mt-3" id="products-pagination">
          <?php
            $queryParams = $_GET;
            for ($i = 1; $i <= $totalPages; $i++):
              $queryParams['page'] = $i;
              $qs = http_build_query($queryParams);
              $active = $i === $current ? 'active' : '';
              echo "<a href='?{$qs}' class='{$active}'>{$i}</a>";
            endfor;
          ?>
        </div>
      <?php endif; ?>

      <button type="button" class="btn go-back mt-3">Back</button>
    </div>
  </div>
</div>