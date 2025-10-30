document.addEventListener('DOMContentLoaded', () => {

    const form = document.querySelector('.auth-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const addressInput = document.getElementById('address');
    const roleSelect = document.getElementById('role');
    
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('password_confirmation');
    const criteriaContainer = document.getElementById('password-criteria');
    const criteriaLength = document.getElementById('criteria-length');
    const criteriaLower = document.getElementById('criteria-lower');
    const criteriaUpper = document.getElementById('criteria-upper');
    const criteriaNumber = document.getElementById('criteria-number');
    const criteriaSymbol = document.getElementById('criteria-symbol');

    const sellerFields = document.getElementById('seller-fields');
    const storeNameInput = document.getElementById('store_name');
    let isEditorInitialized = false;

    const submitButton = form.querySelector('button[type="submit"]');

    const showError = (input, message) => {
        if (!input) return;
        const errorElId = input.id + '-error';
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

    const validateEmail = () => {
        clearError(emailInput);
        if (!emailInput.value.trim()) {
            showError(emailInput, 'Email Address is required.'); return false;
        }
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(String(emailInput.value).toLowerCase())) {
            showError(emailInput, 'Please enter a valid email format.'); return false;
        }
        return true;
    };

    const validateName = () => {
        clearError(nameInput);
        if (!nameInput.value.trim()) {
            showError(nameInput, 'Full Name is required.'); return false;
        }
        if (nameInput.value.trim().length < 2) {
            showError(nameInput, 'Full Name must be at least 2 characters.'); return false;
        }
        return true;
    };

    const validateAddress = () => {
        clearError(addressInput);
        if (!addressInput.value.trim()) {
            showError(addressInput, 'Address is required.'); return false;
        }
        if (addressInput.value.trim().length < 10) {
            showError(addressInput, 'Address must be at least 10 characters.'); return false;
        }
        return true;
    };

    const validateRole = () => {
        clearError(roleSelect);
        if (!roleSelect.value) {
            showError(roleSelect, 'Please choose a role.'); return false;
        }
        return true;
    };

    const validatePasswordLive = () => {
        const password = passwordField.value;
        if (password.length > 0 && criteriaContainer) {
            criteriaContainer.style.display = 'flex';
        }
        
        const hasSymbol = /[^A-Za-z0-9]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasLength = password.length >= 8;
        
        criteriaLength.classList.toggle('valid', hasLength);
        criteriaLower.classList.toggle('valid', hasLower);
        criteriaUpper.classList.toggle('valid', hasUpper);
        criteriaNumber.classList.toggle('valid', hasNumber);
        criteriaSymbol.classList.toggle('valid', hasSymbol);
        
        return hasLength && hasLower && hasUpper && hasNumber && hasSymbol;
    };

    const validatePasswordConfirmation = () => {
        const newPass = passwordField.value;
        const confirmPass = confirmPasswordField.value;
        
        if (!confirmPass) {
            clearError(confirmPasswordField); return true;
        }
        if (newPass !== confirmPass) {
            showError(confirmPasswordField, 'Passwords do not match.'); return false;
        }
        clearError(confirmPasswordField);
        return true;
    };

    const validateStoreName = () => {
        if (roleSelect.value === 'SELLER') {
            clearError(storeNameInput);
            if (!storeNameInput.value.trim()) {
                showError(storeNameInput, 'Store Name is required for sellers.'); return false;
            }
        }
        return true;
    };

    /**
     * Fungsi Toggle Seller (dari sebelumnya, sedikit di-update)
     */
    function toggleSellerFields() {
        if (!roleSelect || !sellerFields || !storeNameInput) return;

        if (roleSelect.value === 'SELLER') {
            sellerFields.style.display = 'block';
            storeNameInput.required = true;
            // Tambahkan validasi live untuk store name
            storeNameInput.addEventListener('blur', validateStoreName);
            storeNameInput.addEventListener('input', () => clearError(storeNameInput));

            if (!isEditorInitialized) {
                createEditor('#editor', 'store_description');
                isEditorInitialized = true;
            }
        } else {
            sellerFields.style.display = 'none';
            storeNameInput.required = false;
            storeNameInput.removeEventListener('blur', validateStoreName);
            storeNameInput.removeEventListener('input', () => clearError(storeNameInput));
            clearError(storeNameInput);
        }
    }
    
    nameInput.addEventListener('blur', validateName);
    nameInput.addEventListener('input', () => clearError(nameInput));
    
    emailInput.addEventListener('blur', validateEmail);
    emailInput.addEventListener('input', () => clearError(emailInput));
    
    addressInput.addEventListener('blur', validateAddress);
    addressInput.addEventListener('input', () => clearError(addressInput));
    
    roleSelect.addEventListener('change', validateRole);
    
    passwordField.addEventListener('input', validatePasswordLive);
    passwordField.addEventListener('input', validatePasswordConfirmation);
    
    confirmPasswordField.addEventListener('input', validatePasswordConfirmation);
    confirmPasswordField.addEventListener('blur', validatePasswordConfirmation);

    roleSelect.addEventListener('change', toggleSellerFields);
    toggleSellerFields();

    initPasswordToggle();
    
    form.addEventListener('submit', (e) => {
        const isNameValid = validateName();
        const isEmailValid = validateEmail();
        const isAddressValid = validateAddress();
        const isRoleValid = validateRole();
        const isPasswordValid = validatePasswordLive();
        const isConfirmValid = validatePasswordConfirmation();
        const isStoreNameValid = validateStoreName();

        if (!isNameValid || !isEmailValid || !isAddressValid || !isRoleValid || 
            !isPasswordValid || !isConfirmValid || !isStoreNameValid) {
            
            e.preventDefault();
            
            if (submitButton) {
                App.hideLoading(submitButton);
            }
        }
    });
});