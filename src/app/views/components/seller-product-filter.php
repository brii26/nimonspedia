<aside class="product-filters">
  <form id="product-filter-form" method="GET" action="/seller/products">
    <h5>Filters</h5>

    <div class="filter-group">
      <label for="search-input">Search</label>
      <input type="search" id="search-input" name="searchTerm" class="form-control"
             placeholder="Search product..." value="<?= View::escape($searchVal) ?>">
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