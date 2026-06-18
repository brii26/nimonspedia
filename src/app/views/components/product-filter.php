<?php
$priceRanges = [
    '-' => 'All',
    '0-15000' => 'Rp 0 - Rp 15.000',
    '15001-50000' => 'Rp 15.001 - Rp 50.000',
    '50001-100000' => 'Rp 50.001 - Rp 100.000',
    '100001-500000' => 'Rp 100.001 - Rp 500.000',
    '500001-' => '> Rp 500.000'
];

$categories = $categories ?? [];
$filters = $filters ?? [];
$extraHiddenFields = $extraHiddenFields ?? [];
?>

<section class="filter-card">
    <form action="<?= View::escape($actionUrl) ?>" method="GET" class="filter-form">
        <input type="hidden" name="page" value="<?= View::escape($filters['page'] ?? 1) ?>">
        <?php foreach ($extraHiddenFields as $name => $value): ?>
            <input type="hidden" name="<?= View::escape($name) ?>" value="<?= View::escape($value) ?>">
        <?php endforeach; ?>

        <div class="form-group search-group">
            <label for="filter-search">Search Product Name</label>

            <div class="search-row">
                <div class="search-input-wrapper">
                    <input type="text" id="filter-search" name="searchTerm"
                           value="<?= View::escape($filters['searchTerm'] ?? '') ?>"
                           placeholder="Search products...">
                    <button type="submit" class="btn btn-search" aria-label="Search">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/>
                        </svg>
                    </button>
                </div>
                <button type="button" id="toggle-advanced-filter" class="btn-toggle-advanced">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
                    Filter
                </button>
            </div>
        </div>

        <div id="advanced-filters-container">
            
            <div class="filter-row">
                <div class="form-group">
                    <label for="filter-category">Category</label>
                    <select id="filter-category" name="categoryId">
                        <option value="">All</option>
                        <?php foreach ($categories as $cat): ?>
                            <option value="<?= View::escape($cat['category_id']) ?>"
                                <?= ($filters['categoryId'] ?? '') == $cat['category_id'] ? 'selected' : '' ?>>
                                <?= View::escape($cat['name']) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="form-group">
                    <label for="filter-price">Price Range</label>
                    <select id="filter-price" name="priceRange">
                        <?php foreach ($priceRanges as $value => $label): ?>
                            <option value="<?= View::escape($value) ?>"
                                <?= ($filters['priceRange'] ?? '') == $value ? 'selected' : '' ?>>
                                <?= View::escape($label) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="form-group">
                    <label for="filter-perPage">Items per Page</label>
                    <select id="filter-perPage" name="perPage">
                        <?php $perPageOptions = [4, 8, 12, 20]; ?>
                        <?php foreach ($perPageOptions as $option): ?>
                            <option value="<?= $option ?>"
                                <?= ($filters['perPage'] ?? 8) == $option ? 'selected' : '' ?>>
                                <?= $option ?> items
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="form-group reset-group">
                    <a href="<?= View::escape($actionUrl) ?><?= !empty($extraHiddenFields) ? '?' . http_build_query($extraHiddenFields) : '' ?>" class="btn btn-secondary">Reset</a>
                </div>

            </div> </div> </form>
</section>