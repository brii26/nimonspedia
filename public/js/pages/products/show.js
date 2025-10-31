// File: public/js/pages/products/show.js

document.addEventListener('DOMContentLoaded', function() {
    const cartForm = document.getElementById('addToCartForm');
    if (!cartForm) return;

    cartForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const form = this;
        const button = form.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        
        button.disabled = true;
        button.textContent = 'Adding...';

        fetchXhr('/cart/add', {
            method: 'POST',
            body: new URLSearchParams(new FormData(form))
        })
        .then(response => {
            if (response.ok) return response.json();
            return response.json().then(err => Promise.reject(err));
        })
        .then(result => {
            const badge = document.querySelector('.cart-badge');
            if (badge && result.data?.uniqueCount) {
                badge.textContent = result.data.uniqueCount;
                badge.style.display = 'flex';
            }
            alert('Item added to cart successfully!');
            button.disabled = false;
            button.textContent = originalText;
        })
        .catch(error => {
            console.error('Error adding to cart:', error);
            alert(error.error || 'Failed to add item to cart');
            button.disabled = false;
            button.textContent = originalText;
        });
    });
});
