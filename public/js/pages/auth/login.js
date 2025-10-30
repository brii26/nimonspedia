document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    const submitButton = form.querySelector('button[type="submit"]');

    // --- Helper Validasi ---
    const showError = (input, message) => {
        if (!input) return;
        const errorElId = input.id + '-error'; // cth: 'email-error'
        const errorEl = document.getElementById(errorElId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.hidden = false;
        }
        input.classList.add('is-invalid');
    };

    const clearError = (input) => {
        if (!input) return;
        const errorElId = input.id + '-error';
        const errorEl = document.getElementById(errorElId);
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.hidden = true;
        }
        input.classList.remove('is-invalid');
    };

    // ---  Validator ---
    
    const validateEmailField = () => {
        clearError(emailField);
        if (!emailField.value.trim()) {
            showError(emailField, 'Email is required');
            return false;
        }
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(String(emailField.value).toLowerCase())) {
            showError(emailField, 'Please enter a valid email address');
            return false;
        }
        return true;
    };

    const validatePasswordField = () => {
        clearError(passwordField);
        if (!passwordField.value) { // Password 'required' tapi bisa spasi
            showError(passwordField, 'Password is required');
            return false;
        }
        return true;
    };

    // --- Event Listeners ---
    
    emailField.addEventListener('input', () => clearError(emailField));
    passwordField.addEventListener('input', () => clearError(passwordField));

    emailField.addEventListener('blur', validateEmailField);
    passwordField.addEventListener('blur', validatePasswordField);
    
    form.addEventListener('submit', function(e) {
        const isEmailValid = validateEmailField();
        const isPasswordValid = validatePasswordField();
        
        if (!isEmailValid || !isPasswordValid) {
            e.preventDefault();
            if (submitButton) {
                App.hideLoading(submitButton);
            }
            return false;
        }
    });
});