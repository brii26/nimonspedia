/**
 * Register page client-side validation
 * Handles real-time password confirmation and form validation
 */

document.addEventListener('DOMContentLoaded', function() {
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('password_confirmation');
    const form = document.querySelector('form');
    
    confirmPasswordField.addEventListener('input', function() {
        validatePasswordConfirmation();
    });
    
    passwordField.addEventListener('input', function() {
        if (confirmPasswordField.value) {
            validatePasswordConfirmation();
        }
        
        validatePasswordStrength();
    });
    
    form.addEventListener('submit', function(e) {
        if (!validateForm()) {
            e.preventDefault();
            return false;
        }
    });
    
    /**
     * Validate password confirmation matches
     */
    function validatePasswordConfirmation() {
        const password = passwordField.value;
        const confirm = confirmPasswordField.value;
        
        if (confirm && password !== confirm) {
            confirmPasswordField.setCustomValidity('Passwords do not match');
            showFieldError(confirmPasswordField, 'Passwords do not match');
            return false;
        } else {
            confirmPasswordField.setCustomValidity('');
            clearFieldError(confirmPasswordField);
            return true;
        }
    }
    
    /**
     * Validate password strength
     */
    function validatePasswordStrength() {
        const password = passwordField.value;
        const minLength = 6;
        
        if (password.length > 0 && password.length < minLength) {
            passwordField.setCustomValidity(`Password must be at least ${minLength} characters`);
            showFieldError(passwordField, `Password must be at least ${minLength} characters`);
            return false;
        } else {
            passwordField.setCustomValidity('');
            clearFieldError(passwordField);
            return true;
        }
    }
    
    /**
     * Validate entire form before submission
     */
    function validateForm() {
        const isPasswordValid = validatePasswordStrength();
        const isConfirmValid = validatePasswordConfirmation();
        
        const requiredFields = ['name', 'email', 'address', 'role', 'password', 'password_confirmation'];
        let allRequiredValid = true;
        
        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (!field.value.trim()) {
                showFieldError(field, `${getFieldLabel(fieldName)} is required`);
                allRequiredValid = false;
            } else {
                clearFieldError(field);
            }
        });
        
        const emailField = document.getElementById('email');
        if (emailField.value && !isValidEmail(emailField.value)) {
            showFieldError(emailField, 'Please enter a valid email address');
            allRequiredValid = false;
        }
        
        return isPasswordValid && isConfirmValid && allRequiredValid;
    }
    
    /**
     * Show error message for a field
     */
    function showFieldError(field, message) {
        clearFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
        
        field.classList.add('error');
    }
    
    /**
     * Clear error message for a field
     */
    function clearFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        field.classList.remove('error');
    }
    
    /**
     * Get user-friendly field label
     */
    function getFieldLabel(fieldName) {
        const labels = {
            'name': 'Full Name',
            'email': 'Email',
            'address': 'Address',
            'role': 'Role',
            'password': 'Password',
            'password_confirmation': 'Password Confirmation'
        };
        return labels[fieldName] || fieldName;
    }
    
    /**
     * Simple email validation
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
});