document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const cartForm = document.getElementById('cartForm');
    if (!cartForm) {
        return; 
    }

    const removeButtons = document.querySelectorAll('.btn-remove');
    const cartBadge = document.querySelector('.cart-badge');
    const csrfToken = cartForm.dataset.csrfToken;
    
    const serverAlert = document.querySelector('.alert.alert-danger');
    if (serverAlert && serverAlert.textContent.trim() && window.App) {
        window.App.showAlert(serverAlert.textContent.trim(), 'error');
    }

    /**
     * Meng-handle update AJAX saat quantity diubah
     */
    const handleQuantityChange = (inputElement) => {
        const input = inputElement;
        let quantity = parseInt(input.value, 10);
        const maxStock = parseInt(input.max, 10);
        const minVal = parseInt(input.min, 10);
        const prevValue = input.dataset.previousValue || minVal;

        if (isNaN(quantity) || quantity < minVal) {
            App.showAlert(`Minimum quantity is ${minVal}`, 'error');
            input.value = prevValue;
            return; // Hentikan eksekusi
        }
        
        // Jika input > stok, kembalikan ke nilai sebelumnya
        if (!isNaN(maxStock) && quantity > maxStock) {
            App.showAlert(`Insufficient stock (max: ${maxStock})`, 'error');
            input.value = prevValue;
            return; // Hentikan eksekusi
        }
        // --- [AKHIR LOGIKA REVERT] ---

        const cartItemRow = input.closest('.cart-item');
        if (!cartItemRow) return;

        // Update nilai 'previous' untuk validasi berikutnya
        input.dataset.previousValue = quantity;

        const productId = cartItemRow.dataset.productId;
        cartItemRow.style.opacity = '0.5';

        // Update status tombol +/-
        const qtySelector = input.closest('.quantity-selector');
        if (qtySelector) {
            qtySelector.querySelector('.btn-qty-minus').disabled = (quantity <= minVal);
            qtySelector.querySelector('.btn-qty-plus').disabled = (!isNaN(maxStock) && quantity >= maxStock);
        }

        const data = new URLSearchParams({
            csrf_token: csrfToken,
            product_id: productId,
            quantity: quantity
        });

        window.fetchXhr('/cart/update', {
            method: 'POST',
            body: data
        })
        .then(response => {
            if (!response.ok) return response.json().then(err => Promise.reject(err));
            return response.json();
        })
        .then(result => {
            if (result.success && result.data.newCartData) {
                updateUI(result.data.newCartData);
            } else {
                throw new Error(result.message || 'Failed to update cart');
            }
        })
        .catch(error => {
            console.error('Failed to update quantity:', error);
            if (window.App) {
                window.App.showAlert(error.error || 'Failed to update cart.', 'error');
            }
            window.location.reload(); 
        })
        .finally(() => {
            cartItemRow.style.opacity = '1';
        });
    };

    /**
     * Memperbarui semua harga di halaman berdasarkan data baru dari server
     */
    const updateUI = (cartData) => {
        const { items, total, groupedCart } = cartData;

        items.forEach(item => {
            const row = cartForm.querySelector(`.cart-item[data-product-id="${item.product_id}"]`);
            if (row) {
                const subtotalElDesktop = row.querySelector('.item-subtotal-desktop');
                const subtotalElMobile = row.querySelector('.item-subtotal-mobile');
                if (subtotalElDesktop) {
                    subtotalElDesktop.textContent = App.formatCurrency(item.subtotal);
                } else if (subtotalElMobile) {
                    subtotalElMobile.textContent = App.formatCurrency(item.subtotal);
                }
                
                const quantityInput = row.querySelector('.cart-quantity');
                if (quantityInput && quantityInput.value != item.quantity) {
                    quantityInput.value = item.quantity;
                    // Simpan juga nilai baru sebagai 'previous'
                    quantityInput.dataset.previousValue = item.quantity;
                }

                // Update status tombol +/- setelah server merespon
                const qtySelector = row.querySelector('.quantity-selector');
                if (qtySelector) {
                    const maxStock = parseInt(quantityInput.max, 10);
                    const minVal = parseInt(quantityInput.min, 10);
                    const currentVal = item.quantity;

                    qtySelector.querySelector('.btn-qty-minus').disabled = (currentVal <= minVal);
                    qtySelector.querySelector('.btn-qty-plus').disabled = (!isNaN(maxStock) && currentVal >= maxStock);
                }
            }
        });

        for (const storeName in groupedCart) {
            const storeData = groupedCart[storeName];
            const storeCard = cartForm.querySelector(`.cart-store-card[data-store-id="${storeData.store_id}"]`);
            if (storeCard) {
                const storeSubtotalEl = storeCard.querySelector('.store-subtotal');
                if (storeSubtotalEl) {
                    storeSubtotalEl.textContent = App.formatCurrency(storeData.subtotal);
                }
            }
        }

        const grandTotalEl = document.getElementById('grand-total-display');
        if (grandTotalEl) {
            grandTotalEl.textContent = App.formatCurrency(total);
        }

        if (cartBadge) {
            const uniqueCount = items.length;
            cartBadge.textContent = uniqueCount;
            cartBadge.style.display = uniqueCount > 0 ? 'flex' : 'none';
        }
    };

    const debouncedUpdate = App.debounce(handleQuantityChange, 400);

    cartForm.addEventListener('input', (e) => {
        if (e.target.classList.contains('cart-quantity')) {
            handleQuantityChange(e.target);
        }
    });

    // --- [LOGIKA BARU] Event listener untuk tombol +/- ---
    cartForm.addEventListener('click', (e) => {
        const button = e.target.closest('.btn-qty');
        if (!button) return;

        const selector = button.closest('.quantity-selector');
        const input = selector.querySelector('.cart-quantity');
        if (!input) return;

        const isPlus = button.classList.contains('btn-qty-plus');
        let currentValue = parseInt(input.value, 10);
        if (isNaN(currentValue)) currentValue = 0;

        if (isPlus) {
            input.stepUp();
        } else {
            input.stepDown();
        }
        
        debouncedUpdate(input);
    });

    /**
     * Logika Tombol Delete (Refactored tanpa async/await)
     */
    if (removeButtons.length > 0) {
        removeButtons.forEach(button => {
            
            button.addEventListener('click', function() {
                const clickedButton = this;
                const productId = clickedButton.dataset.productId;
                const message = 'Are you sure you want to remove this item from your cart?';

                const onOk = () => {
                    document.removeEventListener('confirm:cancel', onCancel);
                    if (window.App) {
                        window.App.showLoading(clickedButton, 'Menghapus...');
                    }

                    const data = new URLSearchParams({
                        csrf_token: csrfToken,
                        product_id: productId
                    });

                    window.fetchXhr('/cart/remove', {
                        method: 'POST',
                        body: data
                    })
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        }
                        return response.json().then(errData => {
                            throw new Error(errData.error || 'Failed to remove item');
                        });
                    })
                    .then(result => {
                        if (result.success) {
                            window.location.reload();
                        } else {
                            throw new Error(result.error || 'Failed to remove item');
                        }
                    })
                    .catch(error => {
                        console.error('Error menghapus item:', error);
                        if (window.App) {
                            window.App.showAlert(error.message, 'error');
                        }
                        if (window.App) {
                            window.App.hideLoading(clickedButton, 'Delete');
                        }
                    });
                };
                
                const onCancel = () => {
                    document.removeEventListener('confirm:ok', onOk);
                };

                document.addEventListener('confirm:ok', onOk, { once: true });
                document.addEventListener('confirm:cancel', onCancel, { once: true });

                if (window.AppConfirm && typeof window.AppConfirm.ask === 'function' && document.querySelector('.app-confirm-modal')) {
                    window.AppConfirm.ask(message);
                } else {
                    if (confirm(message)) {
                        onOk();
                    } else {
                        onCancel();
                    }
                }
            });
        });
    }
});