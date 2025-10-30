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
            const isNameValid = validateNameField();
            const isEmailValid = validateEmailField();
            const isAddressValid = validateAddressField();

            if (!isNameValid || !isEmailValid || !isAddressValid) {
                e.preventDefault();
                console.log('Validasi FE gagal, submit dibatalkan.');
                // (Nanti di langkah berikutnya, kita tidak akan preventDefault,
                // tapi kita akan menjalankan AJAX di sini)

                if (submitButton) {
                    App.hideLoading(submitButton); 
                }
            } else {
                // (Di sinilah nanti logika AJAX akan masuk)
                console.log('Validasi FE lolos.');
            }
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