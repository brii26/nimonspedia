<div class="auth-container">
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
        <form method="POST" action="/register" enctype="multipart/form-data" class="auth-form" novalidate>
            <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
            
            <div class="form-group">
                <label for="name">Full Name</label>
                <input type="text" id="name" name="name" 
                        value="<?= View::escape($old['name'] ?? '') ?>" 
                        required aria-describedby="name-error">
                <small class="error-message" id="name-error" hidden></small>
            </div>
            
            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" 
                        value="<?= View::escape($old['email'] ?? '') ?>" 
                        required aria-describedby="email-error">
                <small class="error-message" id="email-error" hidden></small>
            </div>
            
            <div class="form-group">
                <label for="address">Address</label>
                <textarea id="address" name="address" rows="3" 
                            required aria-describedby="address-error"><?= View::escape($old['address'] ?? '') ?></textarea>
                <small class="error-message" id="address-error" hidden></small>
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
                <small class="error-message" id="role-error" hidden></small>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <div class="password-input-container">
                    <input type="password" id="password" name="password" 
                            required minlength="8" aria-describedby="password-error">
                    <button type="button" class="password-toggle" aria-label="Toggle password visibility" data-target="password">
                        <img src="/assets/icons/eye.svg" alt="Show password" class="icon-eye">
                        <img src="/assets/icons/eye-off.svg" alt="Hide password" class="icon-eye-off">
                    </button>
                </div>
                <div id="password-criteria" style="display:none;"> <small class="criteria-item" id="criteria-length">Minimum 8 characters</small>
                    <small class="criteria-item" id="criteria-lower">At least one lowercase letter</small>
                    <small class="criteria-item" id="criteria-upper">At least one uppercase letter</small>
                    <small class="criteria-item" id="criteria-number">At least one number</small>
                    <small class="criteria-item" id="criteria-symbol">At least one symbol (e.g., _ or !)</small>
                </div>
                <small class="error-message" id="password-error" hidden></small>
            </div>
            
            <div class="form-group">
                <label for="password_confirmation">Confirm Password</label>
                <div class="password-input-container">
                    <input type="password" id="password_confirmation" name="password_confirmation" 
                            required minlength="8" aria-describedby="password-confirmation-error">
                    <button type="button" class="password-toggle" aria-label="Toggle confirm password visibility" data-target="password_confirmation">
                        <img src="/assets/icons/eye.svg" alt="Show password" class="icon-eye">
                        <img src="/assets/icons/eye-off.svg" alt="Hide password" class="icon-eye-off">
                    </button>
                </div>
                <small class="error-message" id="password_confirmation-error" hidden></small>
            </div>
            
            <div id="seller-fields" style="display: none;">
                <div style="height:1px; background:#eee; margin:16px 0;"></div>
                <h3>Store Information</h3>
                <div class="form-group">
                    <label for="store_name">Store Name</label>
                    <input type="text" id="store_name" name="store_name" value="<?= View::escape($old['store_name'] ?? '') ?>">
                </div>
                <div class="form-group" style ="margin-bottom: 15px;">
                    <label for="input_file">Input Logo</label>
                    <input type="file" id="input_file" name="store_logo" accept="image/*">
                </div>
                <div class="form-group">
                    <label for="store_description">Store Description</label>
                    <div id="editor"><?= $old['store_description'] ?? '' ?></div>
                    <input type="hidden" name="store_description" id="store_description">
                </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block">Create Account</button>
        </form>
        
        <nav class="auth-nav">
            <p>Already have an account? <a href="/login">Login here</a></p>
            <p><a href="/" class="btn-link">← Back to Home</a></p>
        </nav>
    </section>
</div>
