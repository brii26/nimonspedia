<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Nimonspedia</title>
	<link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
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
        
        <form method="POST" action="/register" enctype="multipart/form-data">
            <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
            <input type="hidden" name="role" value="<?= View::escape($role ?? ($old['role'] ?? '')) ?>">
            
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
            
            <?php $currentRole = $role ?? ($old['role'] ?? ''); ?>
            <div class="form-group">
                <label>Registering as:</label>
                <div style="padding: 12px; border: 1px solid #ddd; border-radius: 5px; background:#fafafa;">
                    <strong><?= View::escape($currentRole) ?></strong>
                    <a href="/register/role" style="margin-left:8px; font-size:14px;">Change</a>
                </div>
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
            
            <?php if ($currentRole === 'SELLER'): ?>
            <div style="height:1px; background:#eee; margin:16px 0;"></div>
            <h3>Store Information</h3>
            <div class="form-group">
                <label for="store_name">Store Name:</label>
                <input type="text" id="store_name" name="store_name" value="<?= View::escape($old['store_name'] ?? '') ?>" required>
            </div>
            <div class="form-group" style ="margin-bottom: 15px;">
				<label for="input_file">Input Logo:</label>
				<input type="file" id="input_file" name="store_logo" accept="image/*">
			</div>
            <div class="form-group">
                <label for="store_description">Store Description :</label>
				<div id="editor"><?= $old['store_description'] ?? '' ?></div>
                <input type="hidden" name="store_description" id="store_description">
            </div>
            <?php endif; ?>

            <button type="submit">Create Account</button>
        </form>
        
        <div class="links">
            <p>Already have an account? <a href="/login">Login here</a></p>
            <p><a href="/">← Back to Home</a></p>
        </div>
    </div>

	<script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
	<script src="/js/utils/quill-setup.js"></script>
	<script src="/js/pages/auth/register.js"></script>
</body>
</html>