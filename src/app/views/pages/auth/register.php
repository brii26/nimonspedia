<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Nimonspedia</title>
    <link rel="stylesheet" href="/css/global.css">
    <link rel="stylesheet" href="/css/components.css">
    <link rel="stylesheet" href="/css/pages/auth.css">
</head>
<body>
    <main class="auth-container">
        <section class="auth-card">
            <header class="auth-header">
                <h1>Join Nimonspedia</h1>
                <p>Create your account to start buying or selling</p>
            </header>
            
            <?php if (isset($error)): ?>
                <div class="alert alert-error" role="alert" aria-live="polite">
                    <?= View::escape($error) ?>
                </div>
            <?php endif; ?>
            
            <?php if (isset($errors) && is_array($errors)): ?>
                <div class="alert alert-error" role="alert" aria-live="polite">
                    <ul>
                        <?php foreach ($errors as $field => $fieldErrors): ?>
                            <?php foreach ((array)$fieldErrors as $error): ?>
                                <li><?= View::escape($error) ?></li>
                            <?php endforeach; ?>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>
        
            <form method="POST" action="/register" class="auth-form" novalidate>
                <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                
                <div class="form-group">
                    <label for="name">Full Name</label>
                    <input type="text" id="name" name="name" 
                           value="<?= View::escape($old['name'] ?? '') ?>" 
                           required aria-describedby="name-error">
                </div>
                
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" 
                           value="<?= View::escape($old['email'] ?? '') ?>" 
                           required aria-describedby="email-error">
                </div>
                
                <div class="form-group">
                    <label for="address">Address</label>
                    <textarea id="address" name="address" rows="3" 
                              required aria-describedby="address-error"><?= View::escape($old['address'] ?? '') ?></textarea>
                </div>
                
                <div class="form-group">
                    <label for="role">Register as</label>
                    <select id="role" name="role" required aria-describedby="role-error">
                        <option value="">Choose your role...</option>
                        <option value="BUYER" <?= (($old['role'] ?? '') === 'BUYER') ? 'selected' : '' ?>>
                            Buyer - I want to shop
                        </option>
                        <option value="SELLER" <?= (($old['role'] ?? '') === 'SELLER') ? 'selected' : '' ?>>
                            Seller - I want to sell products
                        </option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" 
                           required aria-describedby="password-help password-error">
                    <small id="password-help">Minimum 8 characters with uppercase, lowercase, number and symbol</small>
                </div>
                
                <div class="form-group">
                    <label for="password_confirmation">Confirm Password</label>
                    <input type="password" id="password_confirmation" name="password_confirmation" 
                           required aria-describedby="password-confirmation-error">
                </div>
                
                <button type="submit" class="btn btn-primary btn-block">
                    Create Account
                </button>
            </form>
            
            <nav class="auth-nav">
                <p>Already have an account? <a href="/login">Login here</a></p>
                <p><a href="/" class="btn-link">← Back to Home</a></p>
            </nav>
        </section>
    </main>
    
    <script src="/js/pages/auth/register.js"></script>
</body>
</html>