/**
 * Register page validation - Simple AJAX validation for password and email
 */

document.addEventListener('DOMContentLoaded', () => {
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('password_confirmation');
    const emailField = document.getElementById('email');
    const form = document.querySelector('form');

    const roleSelect = document.getElementById('role');
    const sellerFields = document.getElementById('seller-fields');
    const storeNameInput = document.getElementById('store_name');

    let isEditorInitialized = false;
    
    // Email validation on input
    emailField.addEventListener('input', () => {
        validateEmail();
    });
    
    // Password validation on input
    passwordField.addEventListener('input', () => {
        validatePassword();
        if (confirmPasswordField.value) {
            validatePasswordConfirmation();
        }
    });
    
    confirmPasswordField.addEventListener('input', () => {
        validatePasswordConfirmation();
    });
    
    form.addEventListener('submit', (e) => {
        if (!validateForm()) {
            e.preventDefault();
            return false;
        }
    });

    function toggleSellerFields() {
        if (roleSelect.value === 'SELLER') {
            sellerFields.style.display = 'block';
            storeNameInput.required = true;

            if (!isEditorInitialized) {
                createEditor('#editor', 'store_description');
                isEditorInitialized = true;
            }
        } else {
            sellerFields.style.display = 'none';
            storeNameInput.required = false;
        }
    }

    if (roleSelect) {
        roleSelect.addEventListener('change', toggleSellerFields);
    }

    toggleSellerFields();
    
    // Initialize password visibility toggle
    initPasswordToggle();
    
    /**
     * Validate email format using regex
     */
    function validateEmail() {
        const email = emailField.value.trim();
        removeValidationMessage(emailField);
        
        if (!email) return;
        
        // Email regex validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        
        showValidationMessage(emailField, isValid, 
            isValid ? 'Valid email format' : 'Invalid email format'
        );
        
        return isValid;
    }
    
    /**
     * Validate password requirements (AJAX-like validation)
     */
    function validatePassword() {
        const password = passwordField.value;
        removeValidationMessage(passwordField);
        
        if (!password) return;
        
        // Check all requirements
        const hasLength = password.length >= 8;
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSymbol = /[^a-zA-Z\d]/.test(password);
        
        const isValid = hasLength && hasLower && hasUpper && hasNumber && hasSymbol;
        
        showValidationMessage(passwordField, isValid,
            isValid ? 'Password meets all requirements' : 'Password must be 8+ chars with uppercase, lowercase, number, and symbol'
        );
        
        return isValid;
    }
    
    /**
     * Validate password confirmation matches
     */
    function validatePasswordConfirmation() {
        const password = passwordField.value;
        const confirm = confirmPasswordField.value;
        
        removeValidationMessage(confirmPasswordField);
        
        if (!confirm) return;
        
        const isValid = password === confirm;
        
        showValidationMessage(confirmPasswordField, isValid,
            isValid ? 'Passwords match' : 'Passwords do not match'
        );
        
        return isValid;
    }
    
    /**
     * Show validation message with CSS classes
     */
    function showValidationMessage(field, isValid, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `validation-message ${isValid ? 'valid' : 'invalid'}`;
        messageDiv.textContent = message;
        
        field.parentNode.insertBefore(messageDiv, field.nextSibling);
        field.classList.add(isValid ? 'valid' : 'invalid');
        field.classList.remove(isValid ? 'invalid' : 'valid');
    }
    
    /**
     * Remove validation message
     */
    function removeValidationMessage(field) {
        const existingMessage = field.parentNode.querySelector('.validation-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        field.classList.remove('valid', 'invalid');
    }
    
    /**
     * Simple form validation
     */
    function validateForm() {
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        const isConfirmValid = validatePasswordConfirmation();
        
        return isEmailValid && isPasswordValid && isConfirmValid;
    }
    
    /**
     * Initialize password visibility toggle using CSS classes
     */
    function initPasswordToggle() {
        // Add toggle buttons for password fields
        const passwordFields = [passwordField, confirmPasswordField];
        
        passwordFields.forEach(field => {
            if (field && !field.parentNode.querySelector('.password-toggle')) {
                // Create wrapper with CSS class
                const wrapper = document.createElement('div');
                wrapper.className = 'password-wrapper';
                
                // Create toggle button with CSS class only
                const toggleBtn = document.createElement('button');
                toggleBtn.type = 'button';
                toggleBtn.className = 'password-toggle';
                toggleBtn.innerHTML = 'Buka';
                toggleBtn.setAttribute('aria-label', 'Toggle password visibility');
                
                // Wrap field and add toggle
                field.parentNode.insertBefore(wrapper, field);
                wrapper.appendChild(field);
                wrapper.appendChild(toggleBtn);
                
                // Toggle functionality
                toggleBtn.addEventListener('click', () => {
                    const type = field.getAttribute('type') === 'password' ? 'text' : 'password';
                    field.setAttribute('type', type);
                    toggleBtn.innerHTML = type === 'password' ? 'Buka' : 'Tutup';
                    toggleBtn.setAttribute('aria-label', 
                        type === 'password' ? 'Show password' : 'Hide password'
                    );
                });
            }
        });
    }
});