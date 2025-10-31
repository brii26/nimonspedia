<?php
$path = $path ?? ($_SERVER['REQUEST_URI'] ?? '');
$method = $method ?? ($_SERVER['REQUEST_METHOD'] ?? 'GET');
?>

<div class="page-main">
    <div class="container">
        <header class="page-header">
            <h1>404 — Page not found</h1>
            <p>We couldn't find the page you're looking for.</p>
        </header>

        <main role="main" aria-labelledby="heading-404">
            <section class="error-section">
                <div class="section-content">
                    <p>
                        <strong>Requested URL:</strong>
                        <?= View::escape($path) ?>
                    </p>
                    <p>
                        <strong>Method:</strong>
                        <?= View::escape($method) ?>
                    </p>

                    <div class="error-actions" role="navigation" aria-label="Error actions">
                        <a class="btn btn-secondary" href="/">Go to Home</a>
                    </div>

                    <hr>

                    <p class="muted">If you followed a broken link, please report it to the site administrator.</p>
                </div>
            </section>
        </main>

    </div>
</div>
