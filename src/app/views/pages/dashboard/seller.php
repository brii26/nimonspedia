<div class="container mt-4">
    <div class="row">
        <div class="col">
            <div class="card">
                <div class="card-body">
                    <div id="store-display">
                        <div class="display-layout">
                            
                            <div class="display-col-image">
                                <div class="store-logo-container">
                                    <?php
                                        $logoPath = $store['store_logo_path'] ?? null;
                                        if ($logoPath) {
                                            $imageUrl = '/storage/' . View::escape($logoPath);
                                            $altText = View::escape($store['store_name'] ?? 'Store') . ' Logo';
                                        } else {
                                            $imageUrl = '/images/default-logo-placeholder.png'; 
                                            $altText = 'Default Store Logo';
                                        }
                                    ?>
                                    <img src="<?= $imageUrl ?>" alt="<?= $altText ?>" class="store-logo-img">
                                </div>
                            </div>
                            
                            <div class="display-col-details">
                                <span class="store-badge">Profil Toko</span>
                                <h2 id='store-name-display'><?= View::escape($store['store_name'] ?? 'My Store') ?></h2>
                                <div id="store-description-display">
                                    <?= $store['store_description'] ?? '<p><i>Tidak ada deskripsi. Klik "Edit" untuk menambahkan.</i></p>' ?>
                                </div>
                                <button type="button" id="edit-store-button" class="btn-edit-custom">
                                    <i class="icon-edit"></i> 
                                    Edit Store Info
                                </button>
                            </div>
                        </div>
                    </div>

                    <div id="store-edit">
                        <form>
                            <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                            
                            <div class="edit-layout-simple">

                                <div class="edit-col-image-simple">
                                    <div class="form-group mb-3">
                                        <label>Logo Toko</label>
                                        <label for="edit_file" class="file-upload-label btn-secondary-custom">
                                            <span>Ganti Logo</span>
                                            <input type="file" id="edit_file" name="store_logo" accept="image/*">
                                        </label>
                                    </div>
                                    
                                    <div class="form-group mb-3" id="preview-wrapper">
                                        <img id="image-preview" src="#" alt="Image preview">
                                    </div>
                                </div>

                                <div class="edit-col-details-simple">
                                    <div class="form-group mb-3">
                                        <label for="store_name">Nama Toko</label>
                                        <input type="text" id="store_name" name="store_name" class="form-control-custom" value="<?= View::escape($store['store_name'] ?? '') ?>" required>
                                    </div>
                                    
                                    <div class="form-group mb-3">
                                        <label for="store_description">Deskripsi Toko</label>
                                        <div id="editor"><?= $store['store_description'] ?? '' ?></div>
                                        <input type="hidden" name="store_description" id="store_description">
                                    </div>
                                </div>

                            </div> 
                            <div class="edit-actions">
                                <button type="button" id="cancel-button" class="btn-cancel">Batal</button>
                                <button type="submit" id="save-button" class="btn-save">Simpan Perubahan</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div> <section class="stats-grid mt-4">
                <article class="stat-card">
                    <header class="stat-header">
                        <h3>Revenue</h3>
                    </header>
                    <div class="stat-content">
                        <div class="stat-value"><?= View::currency(0) ?></div>
                        <a href="/seller/analytics" class="btn btn-secondary">Analytics</a>
                    </div>
                </article>

                <article class="stat-card">
                    <header class="stat-header">
                        <h3>Total Product</h3>
                    </header>
                    <div class="stat-content">
                        <div class="stat-value"><?= isset($stats['total_products']) ? (int)$stats['total_products'] : 0 ?></div> 
                        <a href="/seller/products" class="btn btn-secondary">Manage Products</a>
                    </div>
                </article>
                
                <article class="stat-card">
                    <header class="stat-header">
                        <h3>Pending Orders</h3> 
                    </header>
                    <div class="stat-content">
                        <div class="stat-value"><?= isset($stats['total_orders']) ? (int)$stats['total_orders'] : 0 ?></div>
                        <a href="/seller/orders?status=pending" class="btn btn-secondary">View Orders</a>
                    </div>
                </article>

                <article class="stat-card">
                    <header class="stat-header">
                        <h3>Low Stock</h3>
                    </header>
                    <div class="stat-content">
                        <div class="stat-value"><?= isset($stats['low_stocks']) ? (int) $stats['low_stocks'] : 0 ?></div>
                        <a href="/seller/products?stock=low" class="btn btn-secondary">View Stock</a>
                    </div>
                </article>

				<article class="stat-card">
                    <header class="stat-header">
                        <h3>Revenue</h3>
                    </header>
                    <div class="stat-content">
                        <div class="stat-value"><?= View::currency(isset($stats['revenue']) ? (int)$stats['revenue'] : 0) ?></div>
                        <a href="/seller/products?stock=low" class="btn btn-secondary">View Analytics</a>
                    </div>
                </article>

            </section>
            
            </div> </div> <section class="quick-actions">
        <header class="section-header">
            <h2>Quick Actions</h2>
        </header>
        <nav class="actions-nav">
            <a href="/seller/products/add" class="btn btn-success">Add New Product</a>
            <a href="/seller/products" class="btn btn-primary">Manage Products</a>
            <a href="/seller/orders" class="btn btn-secondary">View Orders</a>
            <a href="/seller/store" class="btn btn-secondary">Store Settings</a>
        </nav>
    </section>
    
    <section class="recent-activity">
        <header class="section-header">
            <h2>Recent Activity</h2>
        </header>
        <div class="activity-content">
            <div class="alert alert-info" role="status">
                <p>No recent activity. Start by adding your first product!</p>
            </div>
        </div>
    </section>
</div>