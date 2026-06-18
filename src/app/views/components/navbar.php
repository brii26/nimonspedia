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
$auctionAccess = FeatureFlagService::checkAccess($userId, 'auction_enabled');
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
                    <img src="/assets/images/mascot.png" alt="Nimonspedia Logo" class="brand-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
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
                            <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M4.5 10.5V21h5v-5h5v5h5V10.5"/></svg></span>
                            <span class="nav-text">Home</span>
                        </a>
                        <a href="/login" class="nav-link <?= $activePage === 'login' ? 'active' : '' ?>">
                            <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg></span>
                            <span class="nav-text">Login</span>
                        </a>
                        <a href="/register" class="nav-link <?= $activePage === 'register' ? 'active' : '' ?>">
                            <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"/></svg></span>
                            <span class="nav-text">Register</span>
                        </a>

                    <?php elseif ($userRole === 'BUYER'): ?>
                        <!-- Buyer Navigation -->
                        <a href="/" class="nav-link <?= $activePage === 'home' ? 'active' : '' ?>">
                            <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M4.5 10.5V21h5v-5h5v5h5V10.5"/></svg></span>
                            <span class="nav-text">Home</span>
                        </a>
                        <?php if ($checkoutAccess['allowed']): ?>
                            <a href="/cart" class="nav-link nav-link-cart <?= $activePage === 'cart' ? 'active' : '' ?>">
                                <span class="nav-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
                                    <span class="cart-badge" id="navbar-cart-badge" style="<?= ($cartCount == 0) ? 'display: none;' : '' ?>"><?= $cartCount ?></span>
                                </span>
                                <span class="nav-text">Cart</span>
                            </a>
                        <?php endif; ?>
                        <?php if ($auctionAccess['allowed']): ?>
                            <a href="/auction" class="nav-link <?= $activePage === 'auction' ? 'active' : '' ?>">
                                <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z"/></svg></span>
                                <span class="nav-text">Auction</span>
                            </a>
                        <?php endif; ?>

                    <?php elseif ($userRole === 'SELLER'): ?>
                        <!-- Seller Navigation -->
                        <a href="/seller/products" class="nav-link <?= $activePage === 'seller-products' ? 'active' : '' ?>">
                            <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg></span>
                            <span class="nav-text">Products</span>
                        </a>
                        <a href="/seller/orders" class="nav-link <?= $activePage === 'seller-orders' ? 'active' : '' ?>">
                            <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></span>
                            <span class="nav-text">Orders</span>
                        </a>

                    <?php endif; ?>
                    <?php if ($isLoggedIn && ($userRole === 'BUYER' || $userRole === 'SELLER') && $chatAccess['allowed']): ?>
                        <a href="/chat" class="nav-link <?= $activePage === 'chat' ? 'active' : '' ?>">
                            <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg></span>
                            <span class="nav-text">Chat</span>
                        </a>
                    <?php endif; ?>
                </div>

                <?php if ($isLoggedIn): ?>
                    <div class="navbar-user">
                        <?php if ($userRole === 'BUYER'): ?>
                            <a class="user-balance" href="/profile#balance">
                                <span class="balance-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"/></svg></span>
                                <span class="balance-amount"><?= View::currency($currentUser['balance'] ?? 0) ?></span>
                            </a>
                        <?php elseif ($userRole === 'SELLER'): ?>
                            <div class="user-balance" style="cursor: default;" aria-label="Store Balance">
                                <span class="balance-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"/></svg></span>
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
                                <span class="dropdown-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg></span>
                            </button>

                            <div class="user-dropdown-menu">
                                <a href="/profile" class="dropdown-item <?= $activePage === 'profile' ? 'active' : '' ?>">
                                    <span class="dropdown-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg></span>
                                    <span class="dropdown-text">Profile</span>
                                </a>

                                <?php if ($userRole === 'BUYER'): ?>
                                    <a href="/profile" class="dropdown-item">
                                        <span class="dropdown-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg></span>
                                        <span class="dropdown-text">Top Up Balance</span>
                                    </a>
                                    <a href="/orders" class="dropdown-item <?= $activePage === 'orders' ? 'active' : '' ?>">
                                        <span class="dropdown-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg></span>
                                        <span class="dropdown-text">Orders</span>
                                    </a>
                                    <a href="/reviews/my-reviews" class="dropdown-item <?= $activePage === 'reviews' ? 'active' : '' ?>">
                                        <span class="dropdown-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg></span>
                                        <span class="dropdown-text">My Reviews</span>
                                    </a>
                                <?php endif; ?>
                                <?php if ($userRole === 'SELLER'): ?>
                                    <a href="/seller/reviews" class="dropdown-item <?= $activePage === 'reviews' ? 'active' : '' ?>">
                                        <span class="dropdown-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg></span>
                                        <span class="dropdown-text">Reviews</span>
                                    </a>
                                <?php endif; ?>

                                <div class="dropdown-divider"></div>

                                <form method="POST" action="/logout" class="logout-form">
                                    <input type="hidden" name="csrf_token" value="<?= Auth::csrfToken() ?>">
                                    <button type="submit" class="dropdown-item dropdown-item-logout">
                                        <span class="dropdown-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg></span>
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