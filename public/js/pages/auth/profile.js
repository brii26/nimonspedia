document.addEventListener('DOMContentLoaded', () => {
    const topUpForm = document.getElementById("topUpForm");

    if (topUpForm) {
        topUpForm.addEventListener("submit", (e) =>{
            e.preventDefault();

            const formData = new FormData(topUpForm);
            const resultDiv = document.getElementById("topUpResult");

            formData.append('csrf_token', topUpForm.querySelector('input[name="csrf_token"]').value);

            fetch('/balance/topup', {
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

        fetch("profile/password", {
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