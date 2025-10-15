<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile - Nimonspedia</title>
</head>
<body>
    <nav class="navbar">
        <div class="container d-flex justify-content-between align-items-center">
            <h2><a href="/dashboard">Nimonspedia</a></h2>
            <div>
                <span>Welcome, <?= View::escape($user['name']) ?>!</span>
                <?php if ($user['role'] === 'BUYER'): ?>
                    <span>Balance: <?= View::currency($user['balance']) ?></span>
                <?php endif; ?>
                <a href="/dashboard" class="btn btn-sm btn-secondary">Dashboard</a>
                <form method="POST" action="/logout" style="display: inline;">
                    <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                    <button type="submit" class="btn btn-sm btn-danger">Logout</button>
                </form>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <div class="row">
            <div class="col-6">
                <div class="card">
                    <div class="card-header">
                        <h3>Profile Information</h3>
                    </div>
                    <div class="card-body">
                        <?php if (isset($success)): ?>
                            <div class="alert alert-success"><?= View::escape($success) ?></div>
                        <?php endif; ?>
                        
                        <?php if (isset($error)): ?>
                            <div class="alert alert-danger"><?= View::escape($error) ?></div>
                        <?php endif; ?>
                        
                        <form method="POST" action="/profile">
                            <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                            
                            <div class="form-group">
                                <label for="name">Full Name:</label>
                                <input type="text" id="name" name="name" class="form-control" 
                                       value="<?= View::escape($old['name'] ?? $user['name']) ?>" required>
                                <?php if (isset($errors['name'])): ?>
                                    <div class="error"><?= View::escape($errors['name']) ?></div>
                                <?php endif; ?>
                            </div>
                            
                            <div class="form-group">
                                <label for="email">Email:</label>
                                <input type="email" id="email" name="email" class="form-control" 
                                       value="<?= View::escape($old['email'] ?? $user['email']) ?>" required>
                                <?php if (isset($errors['email'])): ?>
                                    <div class="error"><?= View::escape($errors['email']) ?></div>
                                <?php endif; ?>
                            </div>
                            
                            <div class="form-group">
                                <label for="address">Address:</label>
                                <textarea id="address" name="address" class="form-control" rows="3" required><?= View::escape($old['address'] ?? $user['address']) ?></textarea>
                                <?php if (isset($errors['address'])): ?>
                                    <div class="error"><?= View::escape($errors['address']) ?></div>
                                <?php endif; ?>
                            </div>
                            
                            <div class="form-group">
                                <label>Role:</label>
                                <input type="text" class="form-control" value="<?= View::escape($user['role']) ?>" readonly>
                                <small class="text-muted">Role cannot be changed</small>
                            </div>
                            
                            <?php if ($user['role'] === 'BUYER'): ?>
                            <div class="form-group">
                                <label>Balance:</label>
                                <input type="text" class="form-control" value="<?= View::currency($user['balance']) ?>" readonly>
                                <small class="text-muted">Use top-up feature to add balance</small>
                            </div>
                            <?php endif; ?>
                            
                            <button type="submit" class="btn btn-primary">Update Profile</button>
                        </form>
                    </div>
                </div>
            </div>
            
            <div class="col-6">
                <?php if ($user['role'] === 'BUYER'): ?>
                <div class="card mb-3">
                    <div class="card-header">
                        <h3>Top Up Balance</h3>
                    </div>
                    <div class="card-body">
                        <form id="topUpForm">
                            <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                            
                            <div class="form-group">
                                <label for="amount">Amount:</label>
                                <input type="number" id="amount" name="amount" class="form-control" 
                                       min="10000" step="10000" placeholder="Minimum Rp 10.000" required>
                            </div>
                            
                            <button type="submit" class="btn btn-success">Top Up</button>
                        </form>
                        
                        <div id="topUpResult" class="mt-3"></div>
                    </div>
                </div>
                <?php endif; ?>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Change Password</h3>
                    </div>
                    <div class="card-body">
                        <form id="changePasswordForm">
                            <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                            
                            <div class="form-group">
                                <label for="current_password">Current Password:</label>
                                <input type="password" id="current_password" name="current_password" class="form-control" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="new_password">New Password:</label>
                                <input type="password" id="new_password" name="new_password" class="form-control" 
                                       minlength="6" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="confirm_password">Confirm New Password:</label>
                                <input type="password" id="confirm_password" name="confirm_password" class="form-control" 
                                       minlength="6" required>
                            </div>
                            
                            <button type="submit" class="btn btn-warning">Change Password</button>
                        </form>
                        
                        <div id="passwordResult" class="mt-3"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Top up balance AJAX
        <?php if ($user['role'] === 'BUYER'): ?>
        document.getElementById('topUpForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const resultDiv = document.getElementById('topUpResult');
            
            fetch('/balance/topup', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resultDiv.innerHTML = '<div class="alert alert-success">Balance updated successfully! New balance: Rp ' + 
                        new Intl.NumberFormat('id-ID').format(data.new_balance) + '</div>';
                    // Update balance display in navbar
                    setTimeout(() => location.reload(), 2000);
                } else {
                    resultDiv.innerHTML = '<div class="alert alert-danger">' + data.message + '</div>';
                }
            })
            .catch(error => {
                resultDiv.innerHTML = '<div class="alert alert-danger">An error occurred</div>';
            });
        });
        <?php endif; ?>
        
        // Change password AJAX
        document.getElementById('changePasswordForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const resultDiv = document.getElementById('passwordResult');
            
            fetch('/profile/password', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resultDiv.innerHTML = '<div class="alert alert-success">' + data.message + '</div>';
                    this.reset();
                } else {
                    resultDiv.innerHTML = '<div class="alert alert-danger">' + data.message + '</div>';
                }
            })
            .catch(error => {
                resultDiv.innerHTML = '<div class="alert alert-danger">An error occurred</div>';
            });
        });
    </script>
</body>
</html>