/**
 * Login page client-side validation
 * Handles form validation and user experience enhancements
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    
    form.addEventListener('submit', function(e) {
        if (!validateForm()) {
            e.preventDefault();
            return false;
        }
        
        showLoadingState();
    });
    
    emailField.addEventListener('blur', function() {
        validateEmail();
    });
    
    /**
     * Validate entire form before submission
     */
    function validateForm() {
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        
        return isEmailValid && isPasswordValid;
    }
    
    function validateEmail() {
        const email = emailField.value.trim();
        
        if (!email) {
            showFieldError(emailField, 'Email is required');
            return false;
        }
        
        if (!isValidEmail(email)) {
            showFieldError(emailField, 'Please enter a valid email address');
            return false;
        }
        
        clearFieldError(emailField);
        return true;
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function validatePassword() {
        const password = passwordField.value;
        
        if (!password) {
            showFieldError(passwordField, 'Password is required');
            return false;
        }
        
        clearFieldError(passwordField);
        return true;
    }
    
    /**
     * Show loading state on form submission
     */
    function showLoadingState() {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Logging in...';
            submitButton.disabled = true;
            
            setTimeout(() => {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 3000);
        }
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
});