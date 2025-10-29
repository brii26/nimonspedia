<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Nimonspedia</title>
    <link rel="stylesheet" href="/css/global.css">
    <link rel="stylesheet" href="/css/components.css">
    <link rel="stylesheet" href="/css/pages/auth.css">
</head>
<body>
    <main class="auth-container">
        <section class="auth-card">
            <header class="auth-header">
                <h1>Login to Nimonspedia</h1>
                <p>Access your account to continue</p>
            </header>
            
            <?php if (isset($error)): ?>
                <div class="alert alert-error" role="alert" aria-live="polite">
                    <?= View::escape($error) ?>
                </div>
            <?php endif; ?>
            
            <form method="POST" action="/login" class="auth-form" novalidate>
                <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" 
                           value="<?= View::escape($old['email'] ?? '') ?>" 
                           required aria-describedby="email-error">
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" 
                           required aria-describedby="password-error">
                </div>
                
                <button type="submit" class="btn btn-primary btn-block">
                    Login
                </button>
            </form>
            
            <nav class="auth-nav">
                <p>Don't have an account? <a href="/register">Register here</a></p>
                <p><a href="/" class="btn-link">← Back to Home</a></p>
            </nav>
        </section>
    </main>

    <script src="/js/pages/auth/login.js"></script>
</body>
</html>