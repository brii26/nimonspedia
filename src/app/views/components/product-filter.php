<?php
// Definisikan rentang harga
$priceRanges = [
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
        
        <?php foreach ($extraHiddenFields as $name => $value): ?>
            <input type="hidden" name="<?= View::escape($name) ?>" value="<?= View::escape($value) ?>">
        <?php endforeach; ?>

        <div class="form-group search-group">
            <label for="filter-search">Cari Nama Produk</label>
            <input type="text" id="filter-search" name="searchTerm" 
                   value="<?= View::escape($filters['searchTerm'] ?? '') ?>" 
                   placeholder="Cari produk...">
        </div>

        <div class="form-group">
            <label for="filter-category">Kategori</label>
            <select id="filter-category" name="categoryId">
                <option value="">Semua Kategori</option>
                <?php foreach ($categories as $cat): ?>
                    <option value="<?= View::escape($cat['category_id']) ?>"
                        <?= ($filters['categoryId'] ?? '') == $cat['category_id'] ? 'selected' : '' ?>>
                        <?= View::escape($cat['name']) ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </div>

        <div class="form-group">
            <label for="filter-price">Range Harga</label>
            <select id="filter-price" name="priceRange">
                <option value="">Semua Harga</option>
                <?php foreach ($priceRanges as $value => $label): ?>
                    <option value="<?= View::escape($value) ?>"
                        <?= ($filters['priceRange'] ?? '') == $value ? 'selected' : '' ?>>
                        <?= View::escape($label) ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </div>

        <div class="form-group">
            <label for="filter-perPage">Items per Halaman</label>
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

        <div class="filter-actions form-group">
            <button type="submit" class="btn btn-primary">Filter</button>
            <a href="<?= View::escape($actionUrl) ?><?= !empty($extraHiddenFields) ? '?' . http_build_query($extraHiddenFields) : '' ?>" class="btn btn-secondary">Reset</a>
        </div>
    </form>
</section>