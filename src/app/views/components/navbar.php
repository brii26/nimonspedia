<?php
require_once __DIR__ . '/../../services/FeatureFlagService.php';
// Get current user from session
$currentUser = Auth::user();
$isLoggedIn = Auth::check();
$userRole = $currentUser ? $currentUser['role'] : null;
$storeBalance = $storeBalance ?? 0;
$userId = $currentUser ? $currentUser['user_id'] : null;
$checkoutAccess = FeatureFlagService::checkAccess($userId, 'checkout_enabled');
$chatAccess = FeatureFlagService::checkAccess($userId, 'chat_enabled');
$isChatEnabled = $chatAccess['allowed'];
// Get cart count for buyers
$productRepo = new ProductRepository();
$cartItemRepo = new CartItemRepository();
$cartService = new CartService($productRepo, $cartItemRepo);

$cartCount = $cartService->getUniqueCount();

// Determine active page for navigation highlighting
$currentPath = $_SERVER['REQUEST_URI'];
$activePage = $currentPage ?? '';
?>

<nav class="navbar" role="navigation" aria-label="Main navigation">
    <div class="container">
        <div class="navbar-content">
            <!-- Brand/Logo -->
            <div class="navbar-brand">
                <a href="/" class="brand-link" aria-label="Nimonspedia Home">
                    <img src="/assets/images/logo.svg" alt="Nimonspedia Logo" class="brand-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                    <span class="brand-text">Nimonspedia</span>
                </a>
            </div>
            
            <!-- Mobile Menu Toggle -->
            <button type="button" class="navbar-toggle" aria-label="Toggle navigation menu" aria-expanded="false" data-target="navbar-menu">
                <span class="navbar-toggle-icon">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </button>
            
            <!-- Navigation Menu -->
            <div class="navbar-menu" id="navbar-menu">
                <div class="navbar-nav">
                    <?php if (!$isLoggedIn): ?>
                        <!-- Guest Navigation -->
                        <a href="/" class="nav-link <?= $activePage === 'home' ? 'active' : '' ?>">
                            <span class="nav-icon">🏠</span>
                            <span class="nav-text">Home</span>
                        </a>
                        <a href="/login" class="nav-link <?= $activePage === 'login' ? 'active' : '' ?>">
                            <span class="nav-icon">🔑</span>
                            <span class="nav-text">Login</span>
                        </a>
                        <a href="/register" class="nav-link <?= $activePage === 'register' ? 'active' : '' ?>">
                            <span class="nav-icon">✨</span>
                            <span class="nav-text">Register</span>
                        </a>
                        
                    <?php elseif ($userRole === 'BUYER'): ?>
                        <!-- Buyer Navigation -->
                        <a href="/" class="nav-link <?= $activePage === 'home' ? 'active' : '' ?>">
                            <span class="nav-icon">🏠</span>
                            <span class="nav-text">Home</span>
                        </a>

                        <a href="/auction" class="nav-link <?= $activePage === 'auction' ? 'active' : '' ?>">
                            <span class="nav-icon">🛎️</span>
                            <span class="nav-text">Auction</span>
                        </a>
                        <?php if ($checkoutAccess['allowed']): ?>
                            <a href="/cart" class="nav-link nav-link-cart <?= $activePage === 'cart' ? 'active' : '' ?>">
                                <span class="nav-icon">🛒
                                    <span class="cart-badge" 
                                        id="navbar-cart-badge" 
                                        style="<?= ($cartCount == 0) ? 'display: none;' : '' ?>">
                                        <?= $cartCount ?>
                                    </span>
                                </span>
                                <span class="nav-text">Cart</span>
                            </a>
                        <?php endif; ?>
                        
                    <?php elseif ($userRole === 'SELLER'): ?>
                        <!-- Seller Navigation -->
                        <a href="/" class="nav-link <?= $activePage === 'seller-dashboard' ? 'active' : '' ?>">
                            <span class="nav-icon">📊</span>
                            <span class="nav-text">Dashboard</span>
                        </a>
                        <a href="/seller/products" class="nav-link <?= $activePage === 'seller-products' ? 'active' : '' ?>">
                            <span class="nav-icon">📦</span>
                            <span class="nav-text">My Products</span>
                        </a>
                        <a href="/seller/orders" class="nav-link <?= $activePage === 'seller-orders' ? 'active' : '' ?>">
                            <span class="nav-icon">📋</span>
                            <span class="nav-text">Orders</span>
                        </a>
                        
                    <?php endif; ?>
                </div>
                <?php if ($isLoggedIn && ($userRole === 'BUYER' || $userRole === 'SELLER')): ?>
                        
                        <a href="/auctions" class="nav-link <?= $activePage === 'auctions' ? 'active' : '' ?>">
                            <span class="nav-icon">🔨</span>
                            <span class="nav-text">Lelang</span>
                        </a>

                        <?php if ($chatAccess['allowed']): ?>
                            <a href="/chat" class="nav-link <?= $activePage === 'chat' ? 'active' : '' ?>">
                                <span class="nav-icon">💬</span>
                                <span class="nav-text">Chat</span>
                            </a>
                        <?php endif; ?>

                    <?php endif; ?>
                
                <?php if ($isLoggedIn): ?>
                    <div class="navbar-user">
                        <?php if ($userRole === 'BUYER'): ?>
                            <a class="user-balance" href = "/profile#balance">
                                <span class="balance-icon">💰</span>
                                <span class="balance-amount"><?= View::currency($currentUser['balance'] ?? 0) ?></span>
                            </a>
                        <?php elseif ($userRole === 'SELLER'): ?>
                            <div class="user-balance" style="cursor: default; text-decoration: none;" aria-label="Store Balance">
                                <span class="balance-icon">🏦</span>
                                <span class="balance-amount"><?= View::currency($storeBalance) ?></span>
                            </div>
                        <?php endif; ?>
                        
                        <!-- Profile Dropdown -->
                        <div class="user-dropdown">
                            <button type="button" class="user-dropdown-toggle" aria-label="User menu" aria-expanded="false">
                                <div class="user-avatar">
                                    <span class="avatar-text"><?= strtoupper(substr($currentUser['name'], 0, 1)) ?></span>
                                </div>
                                <div class="user-info">
                                    <span class="user-name"><?= View::escape($currentUser['name']) ?></span>
                                    <span class="user-role"><?= ucfirst(strtolower($userRole)) ?></span>
                                </div>
                                <span class="dropdown-arrow">▼</span>
                            </button>
                            
                            <div class="user-dropdown-menu">
                                <a href="/profile" class="dropdown-item <?= $activePage === 'profile' ? 'active' : '' ?>">
                                    <span class="dropdown-icon">👤</span>
                                    <span class="dropdown-text">Profile</span>
                                </a>
                                
                                <?php if ($userRole === 'BUYER'): ?>
                                    <a href="/profile" class="dropdown-item">
                                        <span class="dropdown-icon">💳</span>
                                        <span class="dropdown-text">Top Up Balance</span>
                                    </a>
                                    <a href="/orders" class="dropdown-item <?= $activePage === 'orders' ? 'active' : '' ?>">
                                        <span class="nav-icon">📦</span>
                                        <span class="nav-text">Orders</span>
                                    </a>
                                    <a href="/reviews/my-reviews" class="dropdown-item <?= $activePage === 'orders' ? 'active' : '' ?>">
                                        <span class="nav-icon">⭐</span>
                                        <span class="nav-text">My Ratings</span>
                                    </a>
                                <?php endif; ?>
                                        
                                <div class="dropdown-divider"></div>
                                
                                <form method="POST" action="/logout" class="logout-form">
                                    <input type="hidden" name="csrf_token" value="<?= Auth::csrfToken() ?>">
                                    <button type="submit" class="dropdown-item dropdown-item-logout">
                                        <span class="dropdown-icon">🚪</span>
                                        <span class="dropdown-text">Logout</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <!-- Mobile Overlay -->
    <div class="navbar-overlay"></div>
</nav>

<!-- Navbar JavaScript (inline for critical functionality) -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const toggleButton = document.querySelector('.navbar-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    const overlay = document.querySelector('.navbar-overlay');
    
    if (toggleButton && navbarMenu) {
        toggleButton.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            
            this.setAttribute('aria-expanded', !isExpanded);
            navbarMenu.classList.toggle('show');
            overlay.classList.toggle('show');
            document.body.classList.toggle('navbar-open');
        });
        
        // Close menu when clicking overlay
        overlay.addEventListener('click', function() {
            toggleButton.setAttribute('aria-expanded', 'false');
            navbarMenu.classList.remove('show');
            overlay.classList.remove('show');
            document.body.classList.remove('navbar-open');
        });
    }
    
    // User dropdown toggle
    const dropdownToggle = document.querySelector('.user-dropdown-toggle');
    const dropdownMenu = document.querySelector('.user-dropdown-menu');
    
    if (dropdownToggle && dropdownMenu) {
        dropdownToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            
            this.setAttribute('aria-expanded', !isExpanded);
            dropdownMenu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            if (dropdownToggle) {
                dropdownToggle.setAttribute('aria-expanded', 'false');
                dropdownMenu.classList.remove('show');
            }
        });
        
        // Prevent dropdown from closing when clicking inside menu
        dropdownMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // Highlight active page
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
});
</script>