<?php
// Ensure $pageTitle and $currentPage are set
$pageTitle = $pageTitle ?? 'Nimonspedia';
$currentPage = $currentPage ?? '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    
    <!-- SEO Meta Tags -->
    <title><?= View::escape($pageTitle) ?> - Nimonspedia</title>
    <meta name="description" content="Nimonspedia - Your trusted online marketplace for buying and selling products">
    <meta name="keywords" content="online shopping, marketplace, buy, sell, products">
    <meta name="author" content="Nimonspedia">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="<?= View::escape($pageTitle) ?> - Nimonspedia">
    <meta property="og:description" content="Your trusted online marketplace">
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?= $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] ?>">
    
    <!-- CSRF Token for JavaScript -->
    <meta name="csrf-token" content="<?= Auth::csrfToken() ?>">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/assets/favicon.ico">
    
    <!-- CSS Framework - External files only -->
    <link rel="stylesheet" href="/css/global.css">
    <link rel="stylesheet" href="/css/components.css">
    <link rel="stylesheet" href="/css/app.css">
    <link rel="stylesheet" href="/css/components/modal.css"> <?php if (isset($cssFiles)): ?><?php endif; ?>
    
    <!-- Page-specific CSS -->
    <?php if (isset($cssFiles)): ?>
        <?php foreach ($cssFiles as $cssFile): ?>
            <link rel="stylesheet" href="<?= $cssFile ?>">
        <?php endforeach; ?>
    <?php endif; ?>
    
    <!-- Global JavaScript -->
    <script src="/js/app.js" defer></script>
</head>
<body class="<?= $bodyClass ?? '' ?>">    
    <!-- Navigation -->
    <?php include __DIR__ . '/navbar.php'; ?>
    
    <!-- Alert Messages -->
    <?php if (isset($_SESSION['success'])): ?>
        <div class="alert alert-success alert-dismissible">
            <span class="alert-message"><?= View::escape($_SESSION['success']) ?></span>
            <button type="button" class="alert-close" aria-label="Close">&times;</button>
        </div>
        <?php unset($_SESSION['success']); ?>
    <?php endif; ?>
    
    <?php if (isset($_SESSION['error'])): ?>
        <div class="alert alert-error alert-dismissible">
            <span class="alert-message"><?= View::escape($_SESSION['error']) ?></span>
            <button type="button" class="alert-close" aria-label="Close">&times;</button>
        </div>
        <?php unset($_SESSION['error']); ?>
    <?php endif; ?>
    
    <?php if (isset($_SESSION['warning'])): ?>
        <div class="alert alert-warning alert-dismissible">
            <span class="alert-message"><?= View::escape($_SESSION['warning']) ?></span>
            <button type="button" class="alert-close" aria-label="Close">&times;</button>
        </div>
        <?php unset($_SESSION['warning']); ?>
    <?php endif; ?>
    
    <!-- Main Content -->
    <main id="main-content" class="main-content">
        <?php if (isset($content)): ?>
            <?= $content ?>
        <?php endif; ?>
    </main>
    
    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>Nimonspedia</h4>
                    <p>Your trusted online marketplace for buying and selling products.</p>
                </div>
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <ul class="footer-links">
                        <li><a href="/">Home</a></li>
                        <li><a href="/">Products</a></li>
                        <li><a href="/about">About</a></li>
                        <li><a href="/contact">Contact</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Legal</h4>
                    <ul class="footer-links">
                        <li><a href="/privacy">Privacy Policy</a></li>
                        <li><a href="/terms">Terms of Service</a></li>
                        <li><a href="/help">Help Center</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; <?= date('Y') ?> Nimonspedia. All rights reserved.</p>
            </div>
        </div>
    </footer>
    
    <!-- Page-specific JavaScript -->
    <?php if (isset($jsFiles)): ?>
        <?php foreach ($jsFiles as $jsFile): ?>
            <script src="<?= $jsFile ?>" defer></script>
        <?php endforeach; ?>
    <?php endif; ?>
    
    <!-- Initialize global components -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize alert close buttons
            document.querySelectorAll('.alert-close').forEach(button => {
                button.addEventListener('click', function() {
                    const alert = this.closest('.alert');
                    alert.classList.add('alert-fade-out');
                    setTimeout(() => alert.remove(), 300);
                });
            });
            
            // Auto-hide alerts after 5 seconds
            document.querySelectorAll('.alert').forEach(alert => {
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.classList.add('alert-fade-out');
                        setTimeout(() => alert.remove(), 300);
                    }
                }, 5000);
            });
        });
    </script>
    <?php
    echo View::component('confirm-modal');

    echo View::component('cart-success-modal', ['recommendations' => []]);

    echo View::component('error-modal');
    ?>
</body>
</html>