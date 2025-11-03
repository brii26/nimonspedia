<?php
// Ambil data produk
$productName = View::escape($product['product_name']);
$productImage = '/storage/' . View::escape($product['main_image_path'] ?? 'product_images/default-product.png');
$storeLink = "/store?id=" . View::escape($product['store_id']);
$storeName = View::escape($product['store_name']);
$storeDescription = $product['store_description'] ?? '<i>Toko ini belum memiliki deskripsi.</i>';

$productPrice = $product['price'];
$stock = (int)$product['stock'];
$isOutOfStock = $stock <= 0;
?>

<div class="product-detail-container">
    <div class="product-detail-grid">

        <aside class="product-gallery">
            <div class="product-main-image-wrapper">
                <img src="<?= $productImage ?>" alt="Gambar utama <?= $productName ?>" class="product-main-image">
            </div>
            </aside>

        <main class="product-info-main">
            <h1 class="product-name"><?= $productName ?></h1>
            
            <div class="product-meta-info">
                <span>
                    Toko: <a href="<?= $storeLink ?>" class="store-link"><?= $storeName ?></a>
                </span>
                <span class="meta-divider">|</span>
                <span>
                    Kategori: <?= View::escape($product['categories']) ?>
                </span>
            </div>

            <div class="product-price">
                <?= View::currency($productPrice) ?>
            </div>

            <hr class="info-divider">

            <!-- Deskripsi Toko sudah dipindah ke sidebar -->

            <div class="product-description-section">
                <h2 class="section-title">Deskripsi Produk</h2>
                <div class="product-description-html">
                    <?= $product['description'] // Render HTML langsung, tanpa escape ?>
                </div>
            </div>
        </main>

        <aside class="product-purchase-sidebar">
            <div class="purchase-card">
                <div class="purchase-card-body">
                    <div class="store-info-simple">
                        <img src="<?= '/storage/' . View::escape($product['store_logo_path'] ?? 'store_logos/default-store.png') ?>" alt="Logo <?= $storeName ?>" class="store-logo-small">
                        <a href="<?= $storeLink ?>" class="store-link"><?= $storeName ?></a>
                    </div>
                    
                    <div class="sidebar-store-description">
                        <?php
                            $plainDescription = strip_tags($storeDescription);
                            $limit = 100;

                            if (mb_strlen($plainDescription) > $limit) {
                                $truncatedText = mb_substr($plainDescription, 0, $limit);
                                
                                echo '<p>' . View::escape($truncatedText) . '...</p>'; 
                                
                                echo '<a href="' . $storeLink . '" class="store-link" style="font-size: 0.875rem; font-weight: 600;">Lihat Selengkapnya</a>';
                            
                            } else {
                                echo $storeDescription;
                            }
                        ?>
                    </div>
                    
                    <hr class="card-divider">

                    <?php if (Auth::check()):?>
                        <form id="addToCartForm" class="add-to-cart-form">
                            <input type="hidden" name="product_id" value="<?= View::escape($product['product_id']) ?>">
                            <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                            
                            <div class="quantity-selector-wrapper">
                                <button type="button" class="btn-quantity" id="btn-qty-minus" aria-label="Kurangi jumlah" <?= $isOutOfStock ? 'disabled' : '' ?>>-</button>
                                <input type="number" name="quantity" class="quantity-input" id="quantity-input" 
                                       value="1" min="1" 
                                       max="<?= $stock ?>" 
                                       aria-label="Jumlah"
                                       <?= $isOutOfStock ? 'disabled' : '' ?>>
                                <button type="button" class="btn-quantity" id="btn-qty-plus" aria-label="Tambah jumlah" <?= $isOutOfStock ? 'disabled' : '' ?>>+</button>
                            </div>
                            
                            <div class="stock-info">
                                Stok: <strong><?= $stock ?></strong>
                            </div>

                            <hr class="card-divider">

                            <div class="subtotal-info">
                                <span>Subtotal</span>
                                <span class="subtotal-price" id="subtotal-price" data-price="<?= $productPrice ?>">
                                    <?= View::currency($productPrice) ?>
                                </span>
                            </div>

                            <div class="action-buttons">
                                <button type="submit" class="btn btn-primary w-100" <?= $isOutOfStock ? 'disabled' : '' ?>>
                                    <?= $isOutOfStock ? 'Stok Habis' : '+ Keranjang' ?>
                                </button>
                            </div>
                        </form>

                    <?php else: // --- TAMPILKAN JIKA GUEST --- ?>
                        <p style="text-align: center; color: #555; margin-bottom: 1rem;">
                            Login terlebih dahulu untuk membeli.
                        </p>
                        <div class="action-buttons">
                            <a href="/login" class="btn btn-secondary w-100" style="background-color: #6c757d; color: white;">
                                Login
                            </a>
                        </div>
                    <?php endif; ?>
                    
                </div>
            </div>
        </aside>

    </div>
</div>