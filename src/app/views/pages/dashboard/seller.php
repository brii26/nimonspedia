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
                    <div class="stat-icon-wrap stat-icon-green">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Revenue</span>
                        <div class="stat-value"><?= View::currency(isset($stats['revenue']) ? (int)$stats['revenue'] : 0) ?></div>
                    </div>
                </article>

                <article class="stat-card">
                    <div class="stat-icon-wrap stat-icon-blue">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg>
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Total Products</span>
                        <div class="stat-value"><?= isset($stats['total_products']) ? (int)$stats['total_products'] : 0 ?></div>
                        <a href="/seller/products" class="stat-action">Manage Products &rarr;</a>
                    </div>
                </article>

                <article class="stat-card">
                    <div class="stat-icon-wrap stat-icon-orange">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Pending Orders</span>
                        <div class="stat-value"><?= isset($stats['total_orders']) ? (int)$stats['total_orders'] : 0 ?></div>
                        <a href="/seller/orders?status=waiting_approval" class="stat-action">View Orders &rarr;</a>
                    </div>
                </article>

                <article class="stat-card">
                    <div class="stat-icon-wrap stat-icon-red">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Low Stock</span>
                        <div class="stat-value"><?= isset($stats['low_stocks']) ? (int)$stats['low_stocks'] : 0 ?></div>
                        <a href="/seller/products?stock=low" class="stat-action">View Stock &rarr;</a>
                    </div>
                </article>

            </section>

            </div> </div>
</div>

<div class="qa-footer-wrap">
    <div class="qa-footer-grid">
        <div class="qa-col">
            <h4 class="qa-col-title">Store</h4>
            <ul class="qa-link-list">
                <li><a href="/seller/dashboard">Dashboard</a></li>
                <li><a href="/seller/products">My Products</a></li>
                <li><a href="/seller/orders">My Orders</a></li>
                <li><a href="/seller/reviews">My Reviews</a></li>
            </ul>
        </div>
        <div class="qa-col">
            <h4 class="qa-col-title">Sell</h4>
            <ul class="qa-link-list">
                <li><a href="/seller/products/create">Add New Product</a></li>
                <li><a href="/seller/products?stock=low">Low Stock Alert</a></li>
                <li><a href="/seller/orders?status=waiting_approval">Pending Orders</a></li>
                <li><a href="/seller/reports/sales">Export Sales (CSV)</a></li>
            </ul>
        </div>
        <div class="qa-col qa-col-brand">
            <h4 class="qa-col-title">Account</h4>
            <ul class="qa-link-list">
                <li><a href="/profile">Store Profile</a></li>
                <li><a href="/chat">Chat</a></li>
                <li><a href="/seller/reviews">Reviews</a></li>
                <li><a href="/seller/reports/sales">Sales Report</a></li>
            </ul>
        </div>
    </div>
</div>