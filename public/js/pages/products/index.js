document.addEventListener('DOMContentLoaded', () => {
    // (MULAI) Logika Halaman (Add to Cart)
    const listContainer = document.getElementById('product-list-container');
    if (!listContainer) return;

    listContainer.addEventListener('submit', function(e) {
        if (!e.target.matches('.add-to-cart-listing')) {
            return;
        }
        
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        
        App.showLoading(btn, 'Adding...');

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
            
            AppCartSuccess.show(btn);
        })
        .catch(error => {
            console.error('Error adding to cart:', error);
            AppError.show(error.error || 'Failed to add to cart');
            App.hideLoading(btn);
        });
    });
});