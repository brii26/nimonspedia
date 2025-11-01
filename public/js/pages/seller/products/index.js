document.addEventListener('DOMContentLoaded', function() {

    const backButton = document.querySelector('.go-back');
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.location.href = '/';
        });
    }

    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');

    if (status === 'product_created') {
        App.showAlert('Product created successfully!', 'success');
    } else if (status === 'product_updated') {
        App.showAlert('Product updated successfully!', 'success');
    } else if (status === 'product_deleted') {
        App.showAlert('Product deleted successfully!', 'success');
    }
});
