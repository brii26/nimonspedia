<?php $recommendations = $recommendations ?? []; ?>
<div class="app-modal" id="cart-success-modal" role="dialog" 
     aria-modal="true" aria-hidden="true" style="display:none;" hidden>
    
    <div class="app-modal-backdrop"></div>
    
    <div class="app-modal-wrapper" role="document">
        <div class="app-modal-card">
            
            <header class="app-modal-header success">
                <h2 id="cart-success-title">Berhasil Ditambahkan!</h2>
                <button type="button" class="app-modal-close" aria-label="Tutup">×</button>
            </header>
            
            <div class="app-modal-body">
                <p id="cart-success-message">Produk telah berhasil ditambahkan ke keranjang Anda.</p>
                
                <?php if (!empty($recommendations)): ?>
                    <h4 class="recommend-title">Produk Lain yang Mungkin Anda Suka</h4>
                    <div class="recommend-grid">
                        <?php foreach ($recommendations as $rec): ?>
                            <a href="/product?id=<?= View::escape($rec['product_id']) ?>" class="recommend-card">
                                <img src="/storage/<?= View::escape($rec['main_image_path'] ?? 'images/product_placeholder.png') ?>" 
                                     alt="<?= View::escape($rec['product_name']) ?>" 
                                     class="recommend-img">
                                <div class="recommend-info">
                                    <p class="recommend-name"><?= View::escape($rec['product_name']) ?></p>
                                    <p class="recommend-price"><?= View::currency($rec['price']) ?></p>
                                </div>
                            </a>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
            
            <footer class="app-modal-footer">
                <button type="button" class="btn btn-secondary app-modal-cancel">Lanjut Belanja</button>
                <a href="/cart" class="btn btn-primary">Lihat Keranjang</a>
            </footer>

        </div>
    </div>
</div>