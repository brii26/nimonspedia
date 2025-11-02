document.addEventListener('DOMContentLoaded', () => {
    // --- (MULAI) Logika Halaman (Add to Cart) ---
    const cartForm = document.getElementById('addToCartForm');
    if (cartForm) {
        cartForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const form = this;
            const button = form.querySelector('button[type="submit"]');
            
            App.showLoading(button, 'Menambahkan...'); // Tampilkan loading

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
                
                AppCartSuccess.show(button); // Panggil fungsi modal LOKAL
            })
            .catch(error => {
                console.error('Error adding to cart:', error);
                AppError.show(error.error || 'Gagal menambahkan item ke keranjang');
                App.hideLoading(button);
            });
        });
    }
    // --- (SELESAI) Logika Halaman (Add to Cart) ---


    // --- (MULAI) Logika Tombol +/- Quantity ---
    const btnMinus = document.getElementById('btn-qty-minus');
    const btnPlus = document.getElementById('btn-qty-plus');
    const qtyInput = document.getElementById('quantity-input');
    const subtotalEl = document.getElementById('subtotal-price');
    
    if (btnMinus && btnPlus && qtyInput && subtotalEl) {
        const productPrice = parseFloat(subtotalEl.getAttribute('data-price'));
        const maxStock = parseInt(qtyInput.max, 10);

        const updateSubtotal = () => {
            let qty = parseInt(qtyInput.value, 10);
            if (isNaN(qty) || qty < 1) qty = 1;
            if (!isNaN(maxStock) && qty > maxStock) qty = maxStock;
            
            qtyInput.value = qty;
            
            const newSubtotal = productPrice * qty;
            subtotalEl.textContent = 'Rp ' + new Intl.NumberFormat('id-ID').format(newSubtotal);
            
            btnMinus.disabled = (qty <= 1);
            if (!isNaN(maxStock)) {
                btnPlus.disabled = (qty >= maxStock);
            }
        };

        btnMinus.addEventListener('click', () => {
            qtyInput.stepDown();
            updateSubtotal();
        });

        btnPlus.addEventListener('click', () => {
            qtyInput.stepUp();
            updateSubtotal();
        });

        qtyInput.addEventListener('change', () => {
            updateSubtotal();
        });
    }
});