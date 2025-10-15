<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Select Role - Nimonspedia</title>
	<link rel="stylesheet" href="/css/auth.css">
</head>
<body>
	<div class="card">
		<h1>Choose Your Role</h1>
		<?php if (isset($error)): ?>
			<div class="error"><?= View::escape($error) ?></div>
		<?php endif; ?>
		<form method="POST" action="/register/role">
			<input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
			<div class="form-group">
				<label>Register as:</label>
				<div style="display:flex; gap:16px; flex-wrap:wrap;">
					<label style="border:1px solid #ddd; border-radius:8px; padding:16px; flex:1; min-width:220px; cursor:pointer;">
						<input type="radio" name="role" value="BUYER" checked>
						<div><strong>Buyer</strong></div>
						<div style="color:#666; font-size:14px;">Shop products and place orders</div>
					</label>
					<label style="border:1px solid #ddd; border-radius:8px; padding:16px; flex:1; min-width:220px; cursor:pointer;">
						<input type="radio" name="role" value="SELLER">
						<div><strong>Seller</strong></div>
						<div style="color:#666; font-size:14px;">Manage your store and sell products</div>
					</label>
				</div>
			</div>
			<button type="submit">Continue</button>
		</form>
		<div class="links">
			<p>Already have an account? <a href="/login">Login here</a></p>
			<p><a href="/">← Back to Home</a></p>
		</div>
	</div>
</body>
</html>


