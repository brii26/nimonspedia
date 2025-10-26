<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Seller Dashboard - Nimonspedia</title>
</head>
<body>
    <nav class="navbar">
        <div class="container d-flex justify-content-between align-items-center">
            <h2>Nimonspedia - Seller Dashboard</h2>
            <div>
                <span>Welcome, <?= View::escape($user['name']) ?>!</span>
                <a href="/profile" class="btn btn-sm btn-secondary">Profile</a>
                <form method="POST" action="/logout" style="display: inline;">
                    <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                    <button type="submit" class="btn btn-sm btn-danger">Logout</button>
                </form>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <!-- Store Information Header -->
        <div class="row mb-4">
            <div class="col">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">			
                        <h3>Header Info</h3>
                    </div>
                    <div class="card-body">
                        <!-- Display Mode -->
					<div id="store-display">
						<h4><?= View::escape($store['store_name'] ?? 'My Store') ?></h4>
						<p class="text-muted"><?= ($store['store_description'] ?? 'No description available') ?></p>

						<p class="small text-muted mb-1">
							<strong>Created:</strong> <?= View::escape($store['created_at'] ?? '-') ?>
						</p>
						<p class="small text-muted mb-3">
							<strong>Last Updated:</strong> <?= View::escape($store['updated_at'] ?? '-') ?>
						</p>

						<button type="button" class="btn btn-sm btn-outline-primary" onclick="toggleEditStore()">Edit Store</button>
					</div>

						
                        
                        <!-- Edit Mode -->
                        <div id="store-edit" style="display: none;">
                            <form method="POST" action="/seller/store/update">
                                <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                                <div class="form-group mb-3">
                                    <label for="store_name">Store Name</label>
                                    <input type="text" id="store_name" name="store_name" class="form-control" value="<?= View::escape($store['store_name'] ?? '') ?>" required>
                                </div>
                                <div class="form-group mb-3">
                                    <label for="store_description">Store Description</label>
                                    <textarea id="store_description" name="store_description" class="form-control" rows="3"><?= View::escape($store['store_description'] ?? '') ?></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary">Save Changes</button>
                                <button type="button" class="btn btn-secondary" onclick="toggleEditStore()">Cancel</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3> Quick Stats Cards</h3>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-3">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h5>Total Products</h5>
                                        <h2><?= isset($stats['total_products']) ? (int)$stats['total_products'] : 0 ?></h2>
                                    </div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h5>Pending Orders</h5>
                                        <h2><?= isset($stats['total_orders']) ? (int)$stats['total_orders'] : 0 ?></h2>
                                    </div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h5>Low Stock</h5>
                                        <h2><?= isset($stats['low_stocks']) ? (int) $stats['low_stocks'] : 0 ?></h2>
									</div>
								</div>
							</div>
                            <div class="col-3">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h5>Revenue</h5>
                                        <h2><?= View::currency(isset($stats['revenue']) ? (int)$stats['revenue'] : 0) ?></h2>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <h4>Quick Actions</h4>
                            <div class="mt-3">
								<a href="/seller/products" class="btn btn-primary btn-sm">Manage Products</a>
								<a href="/seller/orders" class="btn btn-secondary btn-sm">View Orders</a>
								<a href="/seller/products/create" class="btn btn-secondary btn-sm">Add Products</a>
                            </div>
                        </div>
                        
                        <!-- Track 3 Development Area -->
                        <div class="mt-5" style="border: 2px dashed #28a745; padding: 20px;">
                            <h4> Track 3 Development Area</h4>
                            <p><strong>TOLONG BUATIN:</strong></p>
                            <ul>
                                <li>TODO: Implement file upload for product images</li>
                                <li>TODO: Implement order management for sellers</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

	<!--NTAR DI JAVASCRIPT TERPISAH-->
    <script>
        function toggleEditStore() {
            const display = document.getElementById('store-display');
            const edit = document.getElementById('store-edit');
            
            if (display.style.display === 'none') {
                display.style.display = 'block';
                edit.style.display = 'none';
            } else {
                display.style.display = 'none';
                edit.style.display = 'block';
            }
        }
    </script>
</body>
</html>