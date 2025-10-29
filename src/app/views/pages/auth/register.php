<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Nimonspedia</title>
    <link rel="stylesheet" href="/css/auth.css">
</head>
<body>
    <div class="card">
        <h1>Join Nimonspedia</h1>
        
        <?php if (isset($error)): ?>
            <div class="error"><?= View::escape($error) ?></div>
        <?php endif; ?>
        
        <?php if (isset($errors) && is_array($errors)): ?>
            <div class="error">
                <ul>
                    <?php foreach ($errors as $field => $fieldErrors): ?>
                        <?php foreach ((array)$fieldErrors as $error): ?>
                            <li><?= View::escape($error) ?></li>
                        <?php endforeach; ?>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
        
        <form method="POST" action="/register">
            <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
            
            <div class="form-group">
                <label for="name">Full Name:</label>
                <input type="text" id="name" name="name" value="<?= View::escape($old['name'] ?? '') ?>" required>
            </div>
            
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" value="<?= View::escape($old['email'] ?? '') ?>" required>
            </div>
            
            <div class="form-group">
                <label for="address">Address:</label>
                <textarea id="address" name="address" rows="3" required><?= View::escape($old['address'] ?? '') ?></textarea>
            </div>
            
            <div class="form-group">
                <label for="role">Register as:</label>
                <select id="role" name="role" required>
                    <option value="">Choose your role...</option>
                    <option value="BUYER" <?= (($old['role'] ?? '') === 'BUYER') ? 'selected' : '' ?>>Buyer - I want to shop</option>
                    <option value="SELLER" <?= (($old['role'] ?? '') === 'SELLER') ? 'selected' : '' ?>>Seller - I want to sell products</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
                <small>Minimum 6 characters</small>
            </div>
            
            <div class="form-group">
                <label for="password_confirmation">Confirm Password:</label>
                <input type="password" id="password_confirmation" name="password_confirmation" required>
            </div>
            
            <button type="submit">Create Account</button>
        </form>
        
        <div class="links">
            <p>Already have an account? <a href="/login">Login here</a></p>
            <p><a href="/">← Back to Home</a></p>
        </div>
    </div>
    <script src="/js/pages/auth/register.js"></script>
</body>
</html>