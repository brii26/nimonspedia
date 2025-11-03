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

<?php
    echo View::component('seller-product-filter', [
        'categories' => $categories,
        'searchVal'  => $searchVal,
        'catVal'     => $catVal,
        'sortVal'    => $sortVal,
        'perPageVal' => $perPageVal
    ]);
  ?>
  
  <?php
    echo View::component('seller-product-list', [
        'items'      => $items,
        'hasItems'   => $hasItems,
        'current'    => $current,
        'totalPages' => $totalPages
    ]);
  ?>

</div>