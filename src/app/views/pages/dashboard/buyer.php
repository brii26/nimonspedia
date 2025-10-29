<main class="dashboard-main">
    <div class="container">
        <header class="page-header">
            <h1>Buyer Dashboard</h1>
            <p>Manage your shopping activities and account</p>
        </header>

        <section class="dashboard-stats">
            <h2 class="sr-only">Account Overview</h2>
            <div class="stats-grid">
                <article class="stat-card">
                    <header class="stat-header">
                        <h3>Your Balance</h3>
                    </header>
                    <div class="stat-content">
                        <div class="stat-value"><?= View::currency($user['balance']) ?></div>
                        <a href="/profile" class="btn btn-primary">Top Up</a>
                    </div>
                </article>
                
                <article class="stat-card">
                    <header class="stat-header">
                        <h3>Cart Items</h3>
                    </header>
                    <div class="stat-content">
                        <div class="stat-value">0</div>
                        <a href="/cart" class="btn btn-secondary">View Cart</a>
                    </div>
                </article>
                
                <article class="stat-card">
                    <header class="stat-header">
                        <h3>Orders</h3>
                    </header>
                    <div class="stat-content">
                        <div class="stat-value">0</div>
                        <a href="/orders" class="btn btn-secondary">View Orders</a>
                    </div>
                </article>
            </div>
        </section>
        
        <section class="quick-actions">
            <header class="section-header">
                <h2>Quick Actions</h2>
            </header>
            <nav class="actions-nav">
                <a href="/products" class="btn btn-primary">Browse Products</a>
                <a href="/stores" class="btn btn-secondary">Browse Stores</a>
                <a href="/categories" class="btn btn-secondary">Categories</a>
            </nav>
        </section>
        
        <!-- Track 2 Development Area -->
        <section class="development-area">
            <header class="development-header">
                <h2>Track 2 Development Area</h2>
            </header>
            <div class="development-content">
                <p>Tolong bikinin ProductController, CategoryController, and CartController</p>
            </div>
        </section>
    </div>
</main>