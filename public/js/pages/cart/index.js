// /public/js/pages/cart/cart-page.js

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const cartForm = document.getElementById('cartForm');
    if (!cartForm) {
        return;
    }

    const updateCartButton = document.getElementById('updateCart');
    const removeButtons = document.querySelectorAll('.btn-remove');
    const cartBadge = document.querySelector('.cart-badge'); // Untuk helper
    const csrfToken = cartForm.dataset.csrfToken;
    
    const serverAlert = document.querySelector('.alert.alert-danger');
    if (serverAlert && serverAlert.textContent.trim() && window.App) {
        window.App.showAlert(serverAlert.textContent.trim(), 'error');
    }

    /**
     * Helper function untuk meng-update badge di navbar
     */
    async function updateCartBadge() {
        // PERBAIKAN: Gunakan window.fetchXhr
        if (!window.fetchXhr) return; 
        try {
            // PERBAIKAN: Gunakan window.fetchXhr
            const response = await window.fetchXhr('/api/cart/count'); 
            if (!response.ok) return;

            const data = await response.json();
            
            if (cartBadge && data.unique > 0) {
                cartBadge.textContent = data.unique;
                cartBadge.style.display = 'flex'; 
            } else if (cartBadge) {
                cartBadge.style.display = 'none';
            }
        } catch (error) {
            console.error('Error updating cart badge:', error);
        }
    }


    if (updateCartButton) {
        updateCartButton.addEventListener('click', async function() {
            
            // PERBAIKAN: Bungkus panggilan App dengan aman
            if (window.App) {
                window.App.showLoading(this, 'Updating...');
            } else {
                this.disabled = true;
                this.textContent = 'Updating...';
            }
            
            const items = document.querySelectorAll('.cart-item');
            const updatePromises = [];
            
            items.forEach(item => {
                const productId = item.dataset.productId;
                const quantity = item.querySelector('.cart-quantity').value;
                
                const data = new URLSearchParams({
                    csrf_token: csrfToken,
                    product_id: productId,
                    quantity: quantity
                });

                updatePromises.push(
                    // PERBAIKAN: Gunakan window.fetchXhr
                    window.fetchXhr('/cart/update', {
                        method: 'POST',
                        body: data
                    })
                );
            });

            try {
                await Promise.all(updatePromises);
                window.location.reload(); 
            } catch (error) {
                console.error('Gagal mengupdate keranjang:', error);
                
                // PERBAIKAN: Bungkus panggilan App dengan aman
                if (window.App) {
                    window.App.showAlert('Terjadi kesalahan saat mengupdate keranjang.', 'error');
                } else {
                    alert('Terjadi kesalahan saat mengupdate keranjang.');
                }
                window.location.reload(); 
            }
        });
    }

    if (removeButtons.length > 0) {
        removeButtons.forEach(button => {
            button.addEventListener('click', async function() {
                const productId = this.dataset.productId;
                const row = document.querySelector(`.cart-item[data-product-id="${productId}"]`);

                const data = new URLSearchParams({
                    csrf_token: csrfToken,
                    product_id: productId
                });

                try {
                    // PERBAIKAN: Gunakan window.fetchXhr
                    const response = await window.fetchXhr('/cart/remove', {
                        method: 'POST',
                        body: data
                    });

                    if (response.ok) {
                        if (row) row.remove();
                        
                        if (document.querySelectorAll('.cart-item').length === 0) {
                            window.location.reload();
                        } else {
                            updateCartBadge();
                        }
                    } else {
                        const errData = await response.json();
                        // PERBAIKAN: Bungkus panggilan App dengan aman
                        if (window.App) {
                            window.App.showAlert(errData.error || 'Gagal menghapus item', 'error');
                        } else {
                            alert(errData.error || 'Gagal menghapus item');
                        }
                    }
                } catch (error) {
                    console.error('Error menghapus item:', error);
                    // PERBAIKAN: Bungkus panggilan App dengan aman
                    if (window.App) {
                        window.App.showAlert('Gagal menghapus item dari keranjang.', 'error');
                    } else {
                        alert('Gagal menghapus item dari keranjang.');
                    }
                }
            });
        });
    }

});