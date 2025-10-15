<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Nimonspedia</title>
</head>
<body>
    <div class="card">
        <h1>Login to Nimonspedia</h1>
        
        <?php if (isset($error)): ?>
            <div class="error"><?= View::escape($error) ?></div>
        <?php endif; ?>
        
        <form method="POST" action="/login">
            <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
            
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" value="<?= View::escape($old['email'] ?? '') ?>" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit">Login</button>
        </form>
        
        <div class="links">
            <p>Don't have an account? <a href="/register">Register here</a></p>
            <p><a href="/">← Back to Home</a></p>
        </div>
    </div>
    
    <div class="debug-section">
        <h3>Testing Navigation</h3>
        <p><a href="/dashboard">Test Dashboard (requires login)</a></p>
        <p><a href="/profile">Test Profile (requires login)</a></p>
        <p><a href="/register">Go to Register</a></p>
    </div>
</body>
</html>