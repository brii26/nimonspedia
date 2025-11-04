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
                                            $imageUrl = '/storage/'. 'store_logos/default-store.svg'; 
                                            $altText = 'Default Store Logo';
                                        }
                                    ?>
                                    <img src="<?= $imageUrl ?>" alt="<?= $altText ?>" class="store-logo-img">
                                </div>
                            </div>
                            
                            <div class="display-col-details">
                                <span class="store-badge">Store Profile</span>
                                <h2 id='store-name-display'><?= View::escape($store['store_name'] ?? 'My Store') ?></h2>
                                <div id="store-description-display">
                                    <?= $store['store_description'] ?? '<p><i>Tidak ada deskripsi. Klik "Edit" untuk menambahkan.</i></p>' ?>
                                </div>
                                <button type="button" id="edit-store-button" class="btn-edit-custom">
                                    <i class="icon-edit"></i> 
                                    Edit Store
                                </button>
                            </div>
                        </div>
                    </div>

                    <div id="store-edit">
                        <form>
                            <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                            
                            <div class="edit-layout-simple">
                                <div class="edit-col-details-simple">
                                    <div class="form-group mb-3">
                                        <label for="store_name">Store Name</label>
                                        <input type="text" id="store_name" name="store_name" class="form-control-custom" value="<?= View::escape($store['store_name'] ?? '') ?>" required>
                                    </div>
                                    <div class="form-group mb-3">
                                        <label for="store_description">Store Description</label>
                                        <div id="editor"><?= $store['store_description'] ?? '' ?></div>
                                        <input type="hidden" name="store_description" id="store_description">
                                    </div>
									<div class="form-group mb-3">
										<label for="edit_file" class="file-upload-label btn-secondary-custom">
											<span>Edit Logo</span>
											<input type="file" id="edit_file" name="store_logo" accept="image/*">
										</label>
									</div>
                                </div>

								<div class="flex-preview">
									<div class="edit-col-image-simple">
										<div class="form-group mb-3" <?php echo !empty($product['store_logo']) ? 'has-image' : '' ?>" id="preview-wrapper">
											<img id="image-preview"  src="<?php echo !empty($product['store_logo']) ? View::escape('/storage/' . $product['store_logo']) : '#' ?>"  alt="Image preview">
										</div>
									</div>		
								</div>						

                            </div> 
                            <div class="edit-actions">
                                <button type="button" id="cancel-button" class="btn-cancel">Cancel</button>
                                <button type="submit" id="save-button" class="btn-save">Update Store</button>
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
					<div class="stat-value revenue"><?= View::currency(isset($stats['revenue']) ? (int)$stats['revenue'] : 0 )?></div> 
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
                        <a href="/seller/orders?status=waiting_approval" class="btn btn-secondary">View Orders</a>
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

            </section>
            
            </div> </div> <section class="quick-actions">
        <header class="section-header">
            <h2>Quick Actions</h2>
        </header>
        <nav class="actions-nav">
            <a href="/seller/products/create" class="btn btn-success">Add New Product</a>
            <a href="/seller/products" class="btn btn-primary">Manage Products</a>
            <a href="/seller/orders" class="btn btn-primary">View Orders</a>
            <a href="/seller/reports/sales" class="btn btn-primary">Export Laporan (CSV)</a>
        </nav>
    </section>
</div>