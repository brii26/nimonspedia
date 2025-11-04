document.addEventListener('DOMContentLoaded', () => {
    const showError = (input, message) => {
        // Cek jika input ada
        if (!input) return; 
        
        const errorElId = input.id + '-error'; // cth: 'name-error' atau 'confirm_password-error'
        const errorEl = document.getElementById(errorElId);
        
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.hidden = false;
        }
        input.classList.add('is-invalid');
    };

    const clearError = input => {
        // Cek jika input ada
        if (!input) return;

        const errorElId = input.id + '-error';
        const errorEl = document.getElementById(errorElId);
        
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.hidden = true;
        }
        input.classList.remove('is-invalid');
    };

    /**
     * Helper validasi email
     */
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const reset = (submitButton, resultDiv) => {
        if (submitButton) { 
            App.hideLoading(submitButton)
            setTimeout(() => {
                resultDiv.innerHTML = '';
            }, 5000)
        }
    };

    const profileForm = document.getElementById('profileUpdateForm');
    if (profileForm){
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const addressInput = document.getElementById('address');
        const submitButton = document.getElementById('updateProfileButton');

        const validateNameField = () => {
            clearError(nameInput);
            if (!nameInput.value.trim()) {
                showError(nameInput, 'Full Name is required.');
                return false;
            }
            if (nameInput.value.trim().length < 2) {
                showError(nameInput, 'Full Name must be at least 2 characters.');
                return false;
            }
            return true;
        };

        const validateEmailField = () => {
            clearError(emailInput);
            if (!emailInput.value.trim()) {
                showError(emailInput, 'Email Address is required.');
                return false;
            }
            if (!validateEmail(emailInput.value)) {
                showError(emailInput, 'Please enter a valid email format.');
                return false;
            }
            return true;
        };

        const validateAddressField = () => {
            clearError(addressInput);
            if (!addressInput.value.trim()) {
                showError(addressInput, 'Address is required.');
                return false;
            }
            if (addressInput.value.trim().length < 10) {
                showError(addressInput, 'Address must be at least 10 characters.');
                return false;
            }
            return true;
        };

        // --- Event Listeners ---
        
        // Listener 'input' biar error kehapus pas ngetik
        nameInput.addEventListener('input', () => clearError(nameInput));
        emailInput.addEventListener('input', () => clearError(emailInput));
        addressInput.addEventListener('input', () => clearError(addressInput));

        // Listener 'blur' buat validasi pas kursor keluar
        nameInput.addEventListener('blur', validateNameField);
        emailInput.addEventListener('blur', validateEmailField);
        addressInput.addEventListener('blur', validateAddressField);

        // Listener 'submit' buat validasi akhir
        // Extracted AJAX submit logic so it can be called after confirmation
        const submitProfileAjax = form => {
            const resultDiv = document.getElementById('profileUpdateResult');
            resultDiv.innerHTML = '';
            const submitButton = document.getElementById('updateProfileButton');
            const formData = new FormData(form);

            fetchXhr('/profile', {
                method: 'POST',
                body: formData,
            })
            .then(response => response.json())
            .then(data => {
                reset(submitButton, resultDiv);

                if (data.success) {
                    resultDiv.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
                    const navUserName = document.querySelector('.user-name');
                    if (navUserName && data.user && data.user.name) {
                        navUserName.textContent = data.user.name;
                    }
                } else if (data.errors) {
                    Object.keys(data.errors).forEach(key => {
                        const input = document.getElementById(key);
                        const message = data.errors[key];
                        if (input) showError(input, message);
                    });
                    resultDiv.innerHTML = `<div class="alert alert-error">Please fix the errors below.</div>`;
                } else {
                    resultDiv.innerHTML = `<div class="alert alert-error">${data.message || 'An unknown error occurred.'}</div>`;
                }
            })
            .catch(error => {
                console.error('AJAX Error:', error);
                resultDiv.innerHTML = `<div class="alert alert-error">A network error occurred. Please try again.</div>`;
                reset(submitButton, resultDiv);
            });
        }

        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const isNameValid = validateNameField();
            const isEmailValid = validateEmailField();
            const isAddressValid = validateAddressField();

            const resultDiv = document.getElementById('profileUpdateResult');
            resultDiv.innerHTML = '';

            if (!isNameValid || !isEmailValid || !isAddressValid) {
                reset(submitButton, resultDiv);
                return;
            }

            const onConfirm = () => {
                submitProfileAjax(profileForm);
                cleanupListeners();
            };

            const onCancel = () => {
                reset(submitButton, resultDiv);
                cleanupListeners();
            };

            const cleanupListeners = () => {
                document.removeEventListener('confirm:ok', onConfirm);
                document.removeEventListener('confirm:cancel', onCancel);
            };

            document.addEventListener('confirm:ok', onConfirm, { once: true });
            document.addEventListener('confirm:cancel', onCancel, { once: true });

            // Use the app confirm modal if available, otherwise fallback to native confirm
            if (window.AppConfirm && typeof window.AppConfirm.ask === 'function') {
                window.AppConfirm.ask('Save changes to your profile?');
            } else {
                confirm('Save changes to your profile?') ? onConfirm() : onCancel();
            }
        });
    }

    const topUpForm = document.getElementById("topUpForm");
    if (topUpForm) {
        const amountInput = document.getElementById('amount');
        const submitButton = document.getElementById('topUpButton');
        const resultDiv = document.getElementById('topUpResult');

        const validateAmount = () => {
            clearError(amountInput);
            const amount = parseInt(amountInput.value, 10);
            
            if (isNaN(amount) || amountInput.value.trim() === '') {
                showError(amountInput, 'Amount is required.');
                return false;
            }
            if (amount < 10000) {
                showError(amountInput, 'Minimum top up is Rp 10.000.');
                return false;
            }
            return true;
        };

        const submitTopUpAjax = () => {
            if (submitButton) App.showLoading(submitButton, 'Processing...');
            
            const formData = new FormData(topUpForm);
            formData.append('csrf_token', topUpForm.querySelector('input[name="csrf_token"]').value);

            fetchXhr('/balance/topup', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resultDiv.innerHTML = '<div class="alert alert-success">Balance updated successfully! New balance: Rp ' 
                    + new Intl.NumberFormat('id-ID').format(data.new_balance) + '</div>';

                    const navBalance = document.querySelector('.balance-amount');
                    const sidebarBalance = document.querySelector('#sidebar-balance-amount');
                    const formBalance = document.querySelector('#balance-display');
                    if (navBalance && sidebarBalance && formBalance && data.new_balance) {
                        const content = 'Rp ' + new Intl.NumberFormat('id-ID').format(data.new_balance);
                        navBalance.textContent = content;
                        sidebarBalance.textContent = content;
                        formBalance.value = content;
                    }
                    topUpForm.reset();
                } else {
                    resultDiv.innerHTML = '<div class="alert alert-error">' + data.message + '</div>';
                } 
                reset(submitButton, resultDiv);
            })
            .catch(error => {
                resultDiv.innerHTML = '<div class="alert alert-error">An error occurred : ' + error + '</div>';
                reset(submitButton, resultDiv);
            });
        };

        amountInput.addEventListener('input', () => clearError(amountInput));

        topUpForm.addEventListener("submit", (e) =>{
            e.preventDefault();
            resultDiv.innerHTML = '';
            
            if (submitButton) App.showLoading(submitButton, 'Validating...');

            if (!validateAmount()) {
                reset(submitButton, resultDiv);
                return;
            }
            
            const amountValue = new Intl.NumberFormat('id-ID').format(amountInput.value);

            const onConfirm = () => {
                submitTopUpAjax();
                cleanupListeners();
            };

            const onCancel = () => {
                reset(submitButton, resultDiv);
                cleanupListeners();
            };

            const cleanupListeners = () => {
                document.removeEventListener('confirm:ok', onConfirm);
                document.removeEventListener('confirm:cancel', onCancel);
            };

            document.addEventListener('confirm:ok', onConfirm, { once: true });
            document.addEventListener('confirm:cancel', onCancel, { once: true });

            if (window.AppConfirm && typeof window.AppConfirm.ask === 'function') {
                window.AppConfirm.ask(`Anda yakin ingin top up sebesar Rp ${amountValue}?`);
            } else {
                confirm(`Anda yakin ingin top up sebesar Rp ${amountValue}?`) ? onConfirm() : onCancel();
            }
        });
    }

    const changePassword = document.getElementById("changePasswordForm");
    if (changePassword) {
        const currentPasswordInput = document.getElementById('current_password');
        const newPasswordInput = document.getElementById('new_password');
        const confirmPasswordInput = document.getElementById('confirm_password');

        const criteriaLength = document.getElementById('criteria-length');
        const criteriaLower = document.getElementById('criteria-lower');
        const criteriaUpper = document.getElementById('criteria-upper');
        const criteriaNumber = document.getElementById('criteria-number');
        const criteriaSymbol = document.getElementById('criteria-symbol');
        
        const validatePasswordLive = () => {
            const password = newPasswordInput.value;
            
            // Regex
            const hasLower = /[a-z]/.test(password);
            const hasUpper = /[A-Z]/.test(password);
            const hasNumber = /\d/.test(password);
            const hasSymbol = /[^A-Za-z0-9]/.test(password); // non-word
            const hasLength = password.length >= 8;
            
            // Update UI Checklist
            criteriaLength.classList.toggle('valid', hasLength);
            criteriaLower.classList.toggle('valid', hasLower);
            criteriaUpper.classList.toggle('valid', hasUpper);
            criteriaNumber.classList.toggle('valid', hasNumber);
            criteriaSymbol.classList.toggle('valid', hasSymbol);
            
            return hasLength && hasLower && hasUpper && hasNumber && hasSymbol;
        };

        const validatePasswordConfirmation = () => {
            const newPass = newPasswordInput.value;
            const confirmPass = confirmPasswordInput.value;

            if (!confirmPass) {
                clearError(confirmPasswordInput);
                return true;
            }

            if (newPass !== confirmPass) {
                showError(confirmPasswordInput, 'Passwords do not match.');
                return false;
            }

            clearError(confirmPasswordInput);
            return true;
        };

        if (newPasswordInput && confirmPasswordInput) {
            newPasswordInput.addEventListener('input', validatePasswordLive);

            newPasswordInput.addEventListener('input', validatePasswordConfirmation);
            confirmPasswordInput.addEventListener('input', validatePasswordConfirmation);
            confirmPasswordInput.addEventListener('blur', validatePasswordConfirmation);
        }

        changePassword.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const resultDiv = document.getElementById("passwordResult");
            const submitButton = document.getElementById('changePasswordButton');
            resultDiv.innerHTML = '';
            
            const isPasswordValid = validatePasswordLive();
            const newPass = newPasswordInput.value;
            const confirmPass = confirmPasswordInput.value;

            if (!isPasswordValid) {
                resultDiv.innerHTML = '<div class="alert alert-error">Password baru tidak memenuhi kriteria.</div>';
                if (submitButton) App.hideLoading(submitButton);
                return;
            }

            if (newPass !== confirmPass) {
                resultDiv.innerHTML = '<div class="alert alert-error">Konfirmasi password baru tidak cocok.</div>';
                if (submitButton) App.hideLoading(submitButton);
                return; 
            }
            
            const submitPasswordAjax = () => {
                if (submitButton) App.showLoading(submitButton, 'Saving...');
                
                const formData = new FormData(changePassword);
                formData.append("csrf_token", changePassword.querySelector('input[name="csrf_token"]').value);

                fetchXhr("profile/password", {
                    method: "POST",
                    body: formData,
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        resultDiv.innerHTML = '<div class="alert alert-success">' + data.message + '</div>';
                        changePassword.reset();
                        validatePasswordLive();
                    } else {
                        resultDiv.innerHTML = '<div class="alert alert-error">' + data.message + '</div>';
                    }
                    reset(submitButton, resultDiv);
                })
                .catch(error => {
                    resultDiv.innerHTML = '<div class="alert alert-error">An error occurred: '+ error +'</div>';
                    reset(submitButton, resultDiv);
                });
            };
            
            const onConfirm = () => {
                submitPasswordAjax();
                cleanupListeners();
            };

            const onCancel = () => {
                reset(submitButton, resultDiv);
                cleanupListeners();
            };

            const cleanupListeners = () => {
                document.removeEventListener('confirm:ok', onConfirm);
                document.removeEventListener('confirm:cancel', onCancel);
            };

            document.addEventListener('confirm:ok', onConfirm, { once: true });
            document.addEventListener('confirm:cancel', onCancel, { once: true });

            // Panggil modal
            if (window.AppConfirm && typeof window.AppConfirm.ask === 'function') {
                window.AppConfirm.ask('Anda yakin ingin mengubah password?');
            } else {
                confirm('Anda yakin ingin mengubah password?') ? onConfirm() : onCancel();
            }
        });
    }
});