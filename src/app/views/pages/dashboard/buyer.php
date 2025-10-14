<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buyer Dashboard - Nimonspedia</title>
</head>
<body>
    <nav class="navbar">
        <div class="container d-flex justify-content-between align-items-center">
            <h2>Nimonspedia</h2>
            <div>
                <span>Welcome, <?= View::escape($user['name']) ?>!</span>
                <span>Balance: <?= View::currency($user['balance']) ?></span>
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
                        <h3> Buyer Dashboard</h3>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-4">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h5>Your Balance</h5>
                                        <h2><?= View::currency($user['balance']) ?></h2>
                                        <button class="btn btn-primary btn-sm">Top Up</button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h5>Cart Items</h5>
                                        <h2>0</h2>
                                        <a href="/cart" class="btn btn-secondary btn-sm">View Cart</a>
                                    </div>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h5>Orders</h5>
                                        <h2>0</h2>
                                        <a href="/orders" class="btn btn-secondary btn-sm">View Orders</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <h4>Quick Actions</h4>
                            <div class="mt-3">
                                <a href="/products" class="btn btn-primary">Browse Products</a>
                                <a href="/stores" class="btn btn-secondary">Browse Stores</a>
                                <a href="/categories" class="btn btn-secondary">Categories</a>
                            </div>
                        </div>
                        
                        <!-- Track 2 Development Area -->
                        <div class="mt-5" style="border: 2px dashed #007bff; padding: 20px;">
                            <h4>Track 2 Development Area</h4>
                            <p>Tolong bikinin ProductController, CategoryController, and CartController</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>