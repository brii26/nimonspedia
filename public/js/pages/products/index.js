document.addEventListener('DOMContentLoaded', () => {
    
    // (MULAI) Logika API Modal Sukses
    const modalNode = document.getElementById('cart-success-modal');
    let lastActiveButton = null; 

    const closeModal = () => {
        if (!modalNode) return;
        modalNode.style.display = 'none';
        modalNode.setAttribute('aria-hidden', 'true');

        if (lastActiveButton && window.App && typeof App.hideLoading === 'function') {
            App.hideLoading(lastActiveButton);
            lastActiveButton = null; 
        }
    };

    const showSuccessModal = (triggeringButton) => {
        if (!modalNode) return;
        lastActiveButton = triggeringButton; 
        
        modalNode.style.display = 'flex';
        modalNode.setAttribute('aria-hidden', 'false');
        
        // Pasang event listener
        modalNode.querySelector('.app-modal-close').onclick = closeModal;
        modalNode.querySelector('.app-modal-backdrop').onclick = closeModal;
        modalNode.querySelector('.app-modal-cancel').onclick = closeModal;
        
        modalNode.querySelector('a.btn-primary').focus();
    };
    // (SELESAI) Logika API Modal Sukses


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
            
            showSuccessModal(btn);
        })
        .catch(error => {
            console.error('Error adding to cart:', error);
            alert(error.error || 'Gagal menambahkan ke keranjang');
            App.hideLoading(btn);
        });
    });
});