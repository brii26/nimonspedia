// File: public/js/pages/products/index.js

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.add-to-cart-listing').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            
            btn.disabled = true;
            btn.textContent = 'Adding...';

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
                
                btn.textContent = 'Added';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 900);
            })
            .catch(error => {
                console.error('Error adding to cart:', error);
                alert(error.error || 'Gagal menambahkan ke keranjang');
                btn.disabled = false;
                btn.textContent = originalText;
            });
        });
    });
});