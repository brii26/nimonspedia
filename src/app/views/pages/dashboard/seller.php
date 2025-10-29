<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Seller Dashboard - Nimonspedia</title>
    <link rel="stylesheet" href="/css/global.css">
    <link rel="stylesheet" href="/css/components.css">
    <link rel="stylesheet" href="/css/pages/dashboard.css">
</head>
<body>
    <header class="navbar">
        <div class="container navbar-content">
            <div class="brand">
                <h1><a href="/dashboard">Nimonspedia - Seller Panel</a></h1>
            </div>
            <nav class="user-nav">
                <span class="user-info">Welcome, <?= View::escape($user['name']) ?>!</span>
                <a href="/profile" class="btn btn-secondary">Profile</a>
                <form method="POST" action="/logout" class="logout-form">
                    <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                    <button type="submit" class="btn btn-danger">Logout</button>
                </form>
            </nav>
        </div>
    </header>

    <main class="dashboard-main">
        <div class="container">
            <header class="page-header">
                <h1>Seller Dashboard</h1>
                <p>Manage your products, orders, and store</p>
            </header>

            <section class="dashboard-stats">
                <h2 class="sr-only">Store Overview</h2>
                <div class="stats-grid stats-grid-4">
                    <article class="stat-card">
                        <header class="stat-header">
                            <h3>Total Products</h3>
                        </header>
                        <div class="stat-content">
                            <div class="stat-value">0</div>
                            <a href="/seller/products" class="btn btn-primary">Manage Products</a>
                        </div>
                    </article>
                    
                    <article class="stat-card">
                        <header class="stat-header">
                            <h3>Orders</h3>
                        </header>
                        <div class="stat-content">
                            <div class="stat-value">0</div>
                            <a href="/seller/orders" class="btn btn-secondary">View Orders</a>
                        </div>
                    </article>
                    
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
                            <h3>Store Rating</h3>
                        </header>
                        <div class="stat-content">
                            <div class="stat-value">-</div>
                            <a href="/seller/store" class="btn btn-secondary">Store Profile</a>
                        </div>
                    </article>
                </div>
            </section>
            
            <section class="quick-actions">
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
            
            <!-- Track 3 Development Area -->
            <section class="development-area">
                <header class="development-header">
                    <h2>Track 3 Development Area</h2>
                </header>
                <div class="development-content">
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
            </section>
        </div>
    </main>
</body>
</html>