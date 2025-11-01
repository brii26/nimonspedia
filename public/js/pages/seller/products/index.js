document.addEventListener('DOMContentLoaded', function() {

    const backButton = document.querySelector('.go-back');
    if (backButton) {
        backButton.addEventListener('click', function(event) {
            window.location.href='/';
        });
    }
});