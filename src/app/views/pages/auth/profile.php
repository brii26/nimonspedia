<div class="profile-main">
    <div class="container">
        <header class="page-header">
            <h1>Profile Settings</h1>
            <p>Manage your account information and preferences</p>
        </header>
        
        <div class="profile-grid">
            <section class="profile-section">
                <header class="section-header">
                    <h2>Profile Information</h2>
                </header>
                
                <div class="section-content">
                    <?php if (isset($success)): ?>
                        <div class="alert alert-success" role="alert" aria-live="polite">
                            <?= View::escape($success) ?>
                        </div>
                    <?php endif; ?>
                    
                    <?php if (isset($error)): ?>
                        <div class="alert alert-error" role="alert" aria-live="polite">
                            <?= View::escape($error) ?>
                        </div>
                    <?php endif; ?>                        
                    <form method="POST" action="/profile" class="profile-form" id = "profileUpdateForm">
                        <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                        
                        <div class="form-group">
                            <label for="name">Full Name</label>
                            <input type="text" id="name" name="name" 
                                value="<?= View::escape($old['name'] ?? $user['name']) ?>" 
                                required aria-describedby="name-error">
                            <small class="error-message" id="name-error" hidden></small>
                        </div>
                        
                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input type="email" id="email" name="email" 
                                value="<?= View::escape($old['email'] ?? $user['email']) ?>" 
                                required aria-describedby="email-error">
                            <small class="error-message" id="email-error" hidden></small>
                        </div>
                        
                        <div class="form-group">
                            <label for="address">Address</label>
                            <textarea id="address" name="address" rows="3" 
                                        required aria-describedby="address-error"><?= View::escape($old['address'] ?? $user['address']) ?></textarea>
                            <small class="error-message" id="address-error" hidden></small>
                        </div>
                        
                        <div class="form-group">
                            <label for="role-display">Role</label>
                            <input type="text" id="role-display" value="<?= View::escape($user['role']) ?>" readonly>
                            <small>Role cannot be changed</small>
                        </div>
                        
                        <?php if ($user['role'] === 'BUYER'): ?>
                        <div class="form-group">
                            <label for="balance-display">Current Balance</label>
                            <input type="text" id="balance-display" value="<?= View::currency($user['balance']) ?>" readonly>
                            <small>Use top-up feature to add balance</small>
                        </div>
                        <?php endif; ?>
                        
                        <button type="submit" class="btn btn-primary" id="updateProfileButton">Update Profile</button>
                    </form>
                </div>
            </section>
            
            <aside class="profile-sidebar">
                <?php if ($user['role'] === 'BUYER'): ?>
                <section class="balance-section">
                    <header class="section-header">
                        <h2>Top Up Balance</h2>
                    </header>
                    <div class="section-content">
                        <div class="balance-display">
                            <strong>Current Balance: <?= View::currency($user['balance'] ?? 0) ?></strong>
                        </div>
                        
                        <form id="topUpForm" class="topup-form">
                            <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                            
                            <div class="form-group">
                                <label for="amount">Amount</label>
                                <input type="number" id="amount" name="amount" 
                                        min="10000" step="10000" 
                                        placeholder="Minimum Rp 10.000" 
                                        required aria-describedby="amount-help">
                                <small id="amount-help">Minimum amount is Rp 10.000</small>
                            </div>
                            
                            <button type="submit" class="btn btn-success">Top Up Balance</button>
                        </form>
                        
                        <div id="topUpResult" aria-live="polite"></div>
                    </div>
                </section>
                <?php endif; ?>
                
                <section class="password-section">
                    <header class="section-header">
                        <h2>Change Password</h2>
                    </header>
                    <div class="section-content">
                        <form id="changePasswordForm" class="password-form">
                            <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                            
                            <div class="form-group">
                                <label for="current_password">Current Password</label>
                                <div class="password-input-container">
                                    <input type="password" id="current_password" name="current_password" 
                                            required aria-describedby="current-password-error">
                                    <button type="button" class="password-toggle" aria-label="Toggle current password visibility" data-target="current_password">
                                        <img src="/assets/icons/eye.svg" alt="Show password" class="icon-eye">
                                        <img src="/assets/icons/eye-off.svg" alt="Hide password" class="icon-eye-off">
                                    </button>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="new_password">New Password</label>
                                <div class="password-input-container">
                                    <input type="password" id="new_password" name="new_password" 
                                            minlength="6" required aria-describedby="password-help new-password-error">
                                    <button type="button" class="password-toggle" aria-label="Toggle new password visibility" data-target="new_password">
                                        <img src="/assets/icons/eye.svg" alt="Show password" class="icon-eye">
                                        <img src="/assets/icons/eye-off.svg" alt="Hide password" class="icon-eye-off">
                                    </button>
                                </div>
                                <small id="password-help">Minimum 6 characters</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="confirm_password">Confirm New Password</label>
                                <div class="password-input-container">
                                    <input type="password" id="confirm_password" name="confirm_password" 
                                            minlength="6" required aria-describedby="confirm-password-error">
                                    <button type="button" class="password-toggle" aria-label="Toggle confirm password visibility" data-target="confirm_password">
                                        <img src="/assets/icons/eye.svg" alt="Show password" class="icon-eye">
                                        <img src="/assets/icons/eye-off.svg" alt="Hide password" class="icon-eye-off">
                                    </button>
                                </div>
                            </div>
                            
                            <button type="submit" class="btn btn-warning">Change Password</button>
                        </form>
                        
                        <div id="passwordResult" aria-live="polite"></div>
                    </div>
                </section>
            </aside>
        </div>
    </div>
</div>