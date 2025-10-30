// Authentication module
const Auth = {
    // Configuration
    config: {
        minPasswordLength: 8,
        passwordStrengthRegex: {
            weak: /^.{8,}$/,
            medium: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
            strong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
        },
        debounceDelay: 300,
        ajaxTimeout: 10000
    },

    // State management
    state: {
        isSubmitting: false,
        validationTimers: {},
        formData: {}
    },

    // Initialize authentication functionality
    init() {
        this.initPasswordToggle();
        this.initFormValidation();
        this.initAjaxForms();
        this.initPasswordStrength();
        this.initProfileFeatures();
    },

    // Password visibility toggle functionality
    initPasswordToggle() {
        const toggleButtons = document.querySelectorAll('.password-toggle');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const input = button.previousElementSibling;
                const icon = button.querySelector('.toggle-icon');
                
                if (input && input.type === 'password') {
                    input.type = 'text';
                    icon.textContent = '🙈';
                    button.setAttribute('aria-label', 'Hide password');
                } else if (input) {
                    input.type = 'password';
                    icon.textContent = '👁️';
                    button.setAttribute('aria-label', 'Show password');
                }
                
                // Keep focus on input for better UX
                input.focus();
            });
        });
    },

    // Form validation with real-time feedback
    initFormValidation() {
        const forms = document.querySelectorAll('.auth-form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input[required]');
            
            inputs.forEach(input => {
                // Real-time validation on blur
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
                
                // Clear validation on input (debounced)
                input.addEventListener('input', () => {
                    this.clearValidation(input);
                    
                    // Debounced validation for password strength
                    if (input.type === 'password' && input.name === 'password') {
                        this.debounceValidation(input, () => {
                            this.updatePasswordStrength(input);
                        });
                    }
                    
                    // Debounced validation for confirm password
                    if (input.name === 'password_confirmation') {
                        this.debounceValidation(input, () => {
                            this.validatePasswordConfirmation(input);
                        });
                    }
                });
            });
            
            // Form submission validation
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                    return false;
                }
            });
        });
    },

    // AJAX form handling
    initAjaxForms() {
        const ajaxForms = document.querySelectorAll('.auth-form[data-ajax="true"]');
        
        ajaxForms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAjaxSubmit(form);
            });
        });
    },

    // Password strength indicator
    initPasswordStrength() {
        const passwordInputs = document.querySelectorAll('input[name="password"]');
        
        passwordInputs.forEach(input => {
            // Create strength indicator if it doesn't exist
            if (!input.parentNode.querySelector('.password-strength')) {
                this.createPasswordStrengthIndicator(input);
            }
        });
    },

    // Profile-specific features
    initProfileFeatures() {
        this.initBalanceTopUp();
        this.initProfileImageUpload();
        this.initPasswordChange();
    },

    // Field validation
    validateField(input) {
        const value = input.value.trim();
        const fieldName = input.name;
        let isValid = true;
        let message = '';

        // Clear previous validation
        this.clearValidation(input);

        // Required field validation
        if (input.hasAttribute('required') && !value) {
            isValid = false;
            message = `${this.getFieldLabel(input)} is required`;
        }
        
        // Email validation
        else if (input.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                message = 'Please enter a valid email address';
            }
        }
        
        // Password validation
        else if (fieldName === 'password' && value) {
            if (value.length < this.config.minPasswordLength) {
                isValid = false;
                message = `Password must be at least ${this.config.minPasswordLength} characters long`;
            }
        }
        
        // Username validation
        else if (fieldName === 'username' && value) {
            const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
            if (!usernameRegex.test(value)) {
                isValid = false;
                message = 'Username must be 3-20 characters, letters, numbers, and underscores only';
            }
        }
        
        // Name validation
        else if (fieldName === 'name' && value) {
            if (value.length < 2) {
                isValid = false;
                message = 'Name must be at least 2 characters long';
            }
        }

        // Display validation result
        this.displayValidation(input, isValid, message);
        return isValid;
    },

    // Password confirmation validation
    validatePasswordConfirmation(confirmInput) {
        const passwordInput = confirmInput.form.querySelector('input[name="password"]');
        const isValid = passwordInput && confirmInput.value === passwordInput.value;
        const message = isValid ? '' : 'Passwords do not match';
        
        this.displayValidation(confirmInput, isValid, message);
        return isValid;
    },

    // Form validation
    validateForm(form) {
        const inputs = form.querySelectorAll('input[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        // Special validation for password confirmation
        const passwordConfirm = form.querySelector('input[name="password_confirmation"]');
        if (passwordConfirm) {
            if (!this.validatePasswordConfirmation(passwordConfirm)) {
                isValid = false;
            }
        }

        return isValid;
    },

    // Clear field validation styling
    clearValidation(input) {
        const formGroup = input.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('has-error', 'has-success');
            const errorMsg = formGroup.querySelector('.error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        }
    },

    // Display validation result
    displayValidation(input, isValid, message) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        // Remove existing classes and messages
        formGroup.classList.remove('has-error', 'has-success');
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add appropriate styling
        if (input.value.trim()) {
            formGroup.classList.add(isValid ? 'has-success' : 'has-error');
        }

        // Display error message
        if (!isValid && message) {
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = message;
            formGroup.appendChild(errorElement);
        }
    },

    // Password strength indicator
    createPasswordStrengthIndicator(input) {
        const strengthContainer = document.createElement('div');
        strengthContainer.className = 'password-strength';
        strengthContainer.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill"></div>
            </div>
            <div class="strength-text">Password strength</div>
        `;
        
        input.parentNode.insertBefore(strengthContainer, input.nextSibling);
    },

    updatePasswordStrength(input) {
        const strengthContainer = input.parentNode.querySelector('.password-strength');
        if (!strengthContainer) return;

        const password = input.value;
        const strengthFill = strengthContainer.querySelector('.strength-fill');
        const strengthText = strengthContainer.querySelector('.strength-text');

        let strength = 'weak';
        let width = '25%';
        let color = '#e74c3c';

        if (password.length === 0) {
            width = '0%';
            strengthText.textContent = 'Password strength';
            strengthContainer.style.display = 'none';
            return;
        }

        strengthContainer.style.display = 'block';

        if (this.config.passwordStrengthRegex.strong.test(password)) {
            strength = 'strong';
            width = '100%';
            color = '#27ae60';
        } else if (this.config.passwordStrengthRegex.medium.test(password)) {
            strength = 'medium';
            width = '66%';
            color = '#f39c12';
        }

        strengthFill.style.width = width;
        strengthFill.style.backgroundColor = color;
        strengthText.textContent = `Password strength: ${strength.charAt(0).toUpperCase() + strength.slice(1)}`;
    },

    // AJAX form submission
    async handleAjaxSubmit(form) {
        if (this.state.isSubmitting) return;

        // Validate form before submission
        if (!this.validateForm(form)) {
            showAlert('Please fix the errors before submitting', 'error');
            return;
        }

        this.state.isSubmitting = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';

        try {
            // Show loading state
            showLoading(form);
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Please wait...';
            }

            // Prepare form data
            const formData = new FormData(form);
            const jsonData = Object.fromEntries(formData);

            // Make AJAX request
            const response = await fetchXhr(form.action || window.location.pathname, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(jsonData),
                signal: AbortSignal.timeout(this.config.ajaxTimeout)
            });

            const result = await response.json();

            if (result.success) {
                this.handleSuccess(result, form);
            } else {
                this.handleError(result, form);
            }

        } catch (error) {
            console.error('AJAX submission error:', error);
            showAlert('Network error. Please try again.', 'error');
        } finally {
            // Reset form state
            hideLoading();
            this.state.isSubmitting = false;
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    },

    // Handle successful AJAX response
    handleSuccess(result, form) {
        showAlert(result.message || 'Success!', 'success');
        
        // Handle redirects
        if (result.redirect) {
            setTimeout(() => {
                window.location.href = result.redirect;
            }, 1500);
        }
        
        // Reset form if requested
        if (result.resetForm !== false) {
            form.reset();
            this.clearAllValidation(form);
        }
    },

    // Handle error AJAX response
    handleError(result, form) {
        showAlert(result.message || 'An error occurred', 'error');
        
        // Display field-specific errors
        if (result.errors) {
            Object.keys(result.errors).forEach(fieldName => {
                const input = form.querySelector(`[name="${fieldName}"]`);
                if (input) {
                    this.displayValidation(input, false, result.errors[fieldName]);
                }
            });
        }
    },

    // Balance top-up functionality
    initBalanceTopUp() {
        const topUpForm = document.getElementById('topup-form');
        if (!topUpForm) return;

        const amountInput = topUpForm.querySelector('input[name="amount"]');
        const quickAmounts = topUpForm.querySelectorAll('.quick-amount');

        // Quick amount buttons
        quickAmounts.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const amount = btn.dataset.amount;
                if (amountInput) {
                    amountInput.value = amount;
                    amountInput.dispatchEvent(new Event('input'));
                }
                
                // Update button states
                quickAmounts.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Amount input validation
        if (amountInput) {
            amountInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value) || 0;
                const isValid = value >= 10000 && value <= 10000000;
                
                this.displayValidation(amountInput, isValid, 
                    isValid ? '' : 'Amount must be between Rp 10,000 and Rp 10,000,000');
            });
        }
    },

    // Profile image upload
    initProfileImageUpload() {
        const imageInput = document.getElementById('profile-image');
        const imagePreview = document.getElementById('image-preview');
        
        if (!imageInput || !imagePreview) return;

        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            
            if (file) {
                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    showAlert('Please select a valid image file (JPEG, PNG, or GIF)', 'error');
                    return;
                }
                
                // Validate file size (max 2MB)
                if (file.size > 2 * 1024 * 1024) {
                    showAlert('Image file size must be less than 2MB', 'error');
                    return;
                }
                
                // Preview image
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    },

    // Password change functionality
    initPasswordChange() {
        const changePasswordForm = document.getElementById('change-password-form');
        if (!changePasswordForm) return;

        const currentPasswordInput = changePasswordForm.querySelector('input[name="current_password"]');
        const newPasswordInput = changePasswordForm.querySelector('input[name="new_password"]');
        const confirmPasswordInput = changePasswordForm.querySelector('input[name="confirm_password"]');

        // Validate current password on blur
        if (currentPasswordInput) {
            currentPasswordInput.addEventListener('blur', () => {
                if (currentPasswordInput.value.length < this.config.minPasswordLength) {
                    this.displayValidation(currentPasswordInput, false, 
                        'Please enter your current password');
                }
            });
        }

        // Real-time validation for new password confirmation
        if (confirmPasswordInput && newPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                this.debounceValidation(confirmPasswordInput, () => {
                    const isValid = confirmPasswordInput.value === newPasswordInput.value;
                    this.displayValidation(confirmPasswordInput, isValid, 
                        isValid ? '' : 'Passwords do not match');
                });
            });
        }
    },

    // Utility functions
    debounceValidation(input, callback) {
        const fieldName = input.name;
        
        if (this.state.validationTimers[fieldName]) {
            clearTimeout(this.state.validationTimers[fieldName]);
        }
        
        this.state.validationTimers[fieldName] = setTimeout(callback, this.config.debounceDelay);
    },

    getFieldLabel(input) {
        const label = input.closest('.form-group')?.querySelector('label');
        return label ? label.textContent.replace('*', '').trim() : input.name;
    },

    clearAllValidation(form) {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => this.clearValidation(input));
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}