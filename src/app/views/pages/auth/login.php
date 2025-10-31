<div class="auth-container">
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
                <small class="error-message" id="email-error" hidden></small>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <div class="password-input-container">
                    <input type="password" id="password" name="password" 
                        required aria-describedby="password-error">
                    <button type="button" class="password-toggle" aria-label="Toggle confirm password visibility" data-target="password">
                        <img src="/assets/icons/eye.svg" alt="Show password" class="icon-eye">
                        <img src="/assets/icons/eye-off.svg" alt="Hide password" class="icon-eye-off">
                    </button>
                </div>    
                <small class="error-message" id="password-error" hidden></small>
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
</div>