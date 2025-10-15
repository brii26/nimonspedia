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
            <h2>Nimonspedia - Seller Panel</h2>
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
        <div class="row">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3> Seller Dashboard</h3>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-3">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h5>Total Products</h5>
                                        <h2><?= isset($stats['total_products']) ? (int)$stats['total_products'] : 0 ?></h2>
                                        <a href="/seller/products" class="btn btn-primary btn-sm">Manage Products</a>
                                    </div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h5>Orders</h5>
                                        <h2><?= isset($stats['total_orders']) ? (int)$stats['total_orders'] : 0 ?></h2>
                                        <a href="/seller/orders" class="btn btn-secondary btn-sm">View Orders</a>
                                    </div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h5>Revenue</h5>
                                        <h2><?= View::currency(isset($stats['revenue']) ? (int)$stats['revenue'] : 0) ?></h2>
                                        <a href="/seller/analytics" class="btn btn-secondary btn-sm">Analytics</a>
                                    </div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h5>Store Rating</h5>
                                        <h2>-</h2>
                                        <a href="/seller/store" class="btn btn-secondary btn-sm">Store Profile</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <h4>Quick Actions</h4>
                            <div class="mt-3">
                                <a href="/seller/orders" class="btn btn-secondary">View Orders</a>
                                <a href="/seller/store" class="btn btn-secondary">Store Settings</a>
                            </div>
                        </div>
                        
                        <!-- Recent Activity -->
                        <div class="mt-4">
                            <h4>Recent Activity</h4>
                            <div class="alert alert-info">
                                <p>No recent activity. Start by adding your first product!</p>
                            </div>
                        </div>
                        
                        <!-- Track 3 Development Area -->
                        <div class="mt-5" style="border: 2px dashed #28a745; padding: 20px;">
                            <h4> Track 3 Development Area</h4>
                            <p><strong>TOLONG BUATIN:</strong></p>
                            <ul>
                                <li>User authentication is working</li>
                                <li>Seller user data available in <code>$user</code> variable</li>
                                <li>User role validation working (<code>Auth::requireRole('SELLER')</code>)</li>
                                <li>TODO: Implement SellerController</li>
                                <li>TODO: Implement product CRUD (create, read, update, delete)</li>
                                <li>TODO: Implement file upload for product images</li>
                                <li>TODO: Implement order management for sellers</li>
                                <li>TODO: Implement store profile management</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>