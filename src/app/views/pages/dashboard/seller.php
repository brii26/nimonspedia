<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Seller Dashboard - Nimonspedia</title>
	<link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
	<link rel="stylesheet" href="/css/dashboard.css">
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
						<p id='store-name-display'><?= View::escape($store['store_name'] ?? 'My Store') ?></p>
						<div id="store-description-display"><?= $store['store_description'] ?? 'No description available' ?></div>

						<div id="store-logo-path-container">
							<strong>path: </strong> <span id="store-logo-path"><?= View::escape($store['store_logo_path'] ?? '-') ?></span>
						</div>

						<button type="button" id="edit-store-button">Edit Store</button>
					</div>
                        
                        <!-- Edit Mode -->
                        <div id="store-edit">
                            <form>
                                <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                                <div class="form-group mb-3">
                                    <label for="store_name">Store Name</label>
                                    <input type="text" id="store_name" name="store_name" class="form-control" value="<?= View::escape($store['store_name'] ?? '') ?>" required>
                                </div>
								<div class="form-group mb-3">
									<label for="edit_file">Edit Logo:</label>
									<input type="file" id="edit_file" name="store_logo" accept="image/*">
								</div>
                                <div class="form-group mb-3">
                                    <label for="store_description">Store Description</label>
									<div id="editor"><?= $store['store_description'] ?? '' ?></div>
									<input type="hidden" name="store_description" id="store_description">
                                </div>
                                <button type="submit" id="save-button">Save Changes</button>
                                <button type="button" id="cancel-button">Cancel</button>
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
                                <li>TODO: Implement order management for sellers</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

	<script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
	<script src ="/js/utils/quill-setup.js"></script>
    <script src ="/js/pages/dashboard/seller.js"></script>
	</body>
</html>