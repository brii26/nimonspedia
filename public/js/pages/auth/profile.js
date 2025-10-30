document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profileUpdateForm');
    if (profileForm){
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const addressInput = document.getElementById('address');
        const submitButton = document.getElementById('updateProfileButton');

        const showError = (input, message) => {
            const errorEl = document.getElementById(input.id + '-error'); // cth: 'name-error'
            if (errorEl) {
                errorEl.textContent = message;
                errorEl.hidden = false;
            }
            input.classList.add('is-invalid');
        };

        const clearError = (input) => {
            const errorEl = document.getElementById(input.id + '-error');
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.hidden = true;
            }
            input.classList.remove('is-invalid');
        };

        const validateEmail = (email) => {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(String(email).toLowerCase());
        };

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
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const isNameValid = validateNameField();
            const isEmailValid = validateEmailField();
            const isAddressValid = validateAddressField();

            const resultDiv = document.getElementById('profileUpdateResult');
            resultDiv.innerHTML = ''

            if (!isNameValid || !isEmailValid || !isAddressValid) {
                console.log('Validasi FE gagal, submit dibatalkan.');
                if (submitButton) App.hideLoading(submitButton); 
                return;
            }
            console.log('Validasi FE berhasil, kirim AJAX');
            const formData = new FormData(profileForm);
            fetchXhr('/profile', {
                method: 'POST',
                body: formData,
            })
            .then(response => response.json())
            .then(data => {
                if (submitButton) App.hideLoading(submitButton);

                if (data.success) {
                    resultDiv.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
                    
                    const navUserName = document.querySelector('.user-name');
                    if (navUserName && data.user && data.user.name) {
                        navUserName.textContent = data.user.name;
                    }
                }

                else if (data.errors) {
                    console.log('Validasi BE gagal:', data.errors);
                    Object.keys(data.errors).forEach(key => {
                        const input = document.getElementById(key); // cth: 'email'
                        const message = data.errors[key];
                        if (input) {
                            showError(input, message);
                        }
                    });
                    resultDiv.innerHTML = `<div class="alert alert-error">Please fix the errors below.</div>`;
                } else {
                    resultDiv.innerHTML = `<div class="alert alert-error">${data.message || 'An unknown error occurred.'}</div>`;
                }
            })
            .catch(error => {
                console.error('AJAX Error:', error);
                if (submitButton) App.hideLoading(submitButton);
                resultDiv.innerHTML = `<div class="alert alert-error">A network error occurred. Please try again.</div>`;
            })
        });
    }

    const topUpForm = document.getElementById("topUpForm");
    if (topUpForm) {
        topUpForm.addEventListener("submit", (e) =>{
            e.preventDefault();

            const formData = new FormData(topUpForm);
            const resultDiv = document.getElementById("topUpResult");

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
                    setTimeout(() => location.reload(), 2000);
                } else {
                    resultDiv.innerHTML = '<div class="alert alert-danger">' + data.message + '</div>';
                }
            })
            .catch(error => {
                resultDiv.innerHTML = '<div class="alert alert-danger">An error occurred : ' + error + '</div>';
            });

        })
    }

    const changePassword = document.getElementById("changePasswordForm");
    changePassword.addEventListener("submit", (e) => {
        e.preventDefault();

        const formData = new FormData(changePassword);
        const resultDiv = document.getElementById("passwordResult");

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
            } else {
                resultDiv.innerHTML = '<div class="alert alert-danger">' + data.message + '</div>';
            }
        })
        .catch(error => {
            resultDiv.innerHTML = '<div class="alert alert-danger">An error occurred: '+ error +'</div>';
        });
    })

})