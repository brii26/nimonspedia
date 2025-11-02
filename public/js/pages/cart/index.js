// /public/js/pages/cart/index.js

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const cartForm = document.getElementById('cartForm');
    if (!cartForm) {
        return; // Keluar jika bukan halaman keranjang
    }

    // --- Ambil Elemen ---
    const removeButtons = document.querySelectorAll('.btn-remove');
    const cartBadge = document.querySelector('.cart-badge');
    const csrfToken = cartForm.dataset.csrfToken;
    
    // Tampilkan error server jika ada
    const serverAlert = document.querySelector('.alert.alert-danger');
    if (serverAlert && serverAlert.textContent.trim() && window.App) {
        window.App.showAlert(serverAlert.textContent.trim(), 'error');
    }


    // --- (MULAI) LOGIKA BARU: REAL-TIME UPDATE QUANTITY ---
    
    /**
     * Meng-handle update AJAX saat quantity diubah
     */
    const handleQuantityChange = (event) => {
        const input = event.target;
        const quantity = parseInt(input.value, 10);
        const cartItemRow = input.closest('.cart-item');
        
        if (!cartItemRow || isNaN(quantity)) return; // Abaikan jika input tidak valid

        const productId = cartItemRow.dataset.productId;

        // Tampilkan loading visual (opsional, tapi bagus)
        cartItemRow.style.opacity = '0.5';

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
                throw new Error(result.message || 'Gagal mengupdate keranjang');
            }
        })
        .catch(error => {
            console.error('Gagal mengupdate quantity:', error);
            if (window.App) {
                window.App.showAlert(error.error || 'Gagal mengupdate keranjang.', 'error');
            }
            // Balikin ke value lama jika error (opsional)
            // input.value = input.dataset.previousValue || quantity;
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

        // 1. Update Subtotal Item
        items.forEach(item => {
            const row = cartForm.querySelector(`.cart-item[data-product-id="${item.product_id}"]`);
            if (row) {
                const subtotalEl = row.querySelector('.item-subtotal');
                if (subtotalEl) {
                    subtotalEl.textContent = App.formatCurrency(item.subtotal);
                }

                const quantityInput = row.querySelector('.cart-quantity');
                if (quantityInput && quantityInput.value != item.quantity) {
                    quantityInput.value = item.quantity;
                }
            }
        });

        // 2. Update Subtotal Toko
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

        // 3. Update Grand Total
        const grandTotalEl = document.getElementById('grand-total-display');
        if (grandTotalEl) {
            grandTotalEl.textContent = App.formatCurrency(total);
        }

        // 4. Update Cart Badge
        if (cartBadge) {
            const uniqueCount = items.length;
            cartBadge.textContent = uniqueCount;
            cartBadge.style.display = uniqueCount > 0 ? 'flex' : 'none';
        }
    };

    // Buat versi debounced dari fungsi update
    // Ini mencegah server di-spam setiap kali user mengetik angka
    const debouncedUpdate = App.debounce(handleQuantityChange, 400);

    // Pasang listener di form, delegasikan ke input quantity
    cartForm.addEventListener('input', (e) => {
        if (e.target.classList.contains('cart-quantity')) {
            debouncedUpdate(e);
        }
    });

    // --- (SELESAI) LOGIKA BARU ---


    /**
     * Logika Tombol Hapus (Ini masih sama seperti kodemu sebelumnya)
     */
    if (removeButtons.length > 0) {
        removeButtons.forEach(button => {
            
            button.addEventListener('click', function() {
                const clickedButton = this;
                const productId = clickedButton.dataset.productId;
                const row = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
                const originalButtonText = clickedButton.textContent || 'Hapus';
                const message = 'Apakah Anda yakin ingin menghapus item ini dari keranjang?';

                const onOk = () => {
                    document.removeEventListener('confirm:cancel', onCancel);
                    if (window.App) {
                        window.App.showLoading(clickedButton, 'Menghapus...');
                    } else {
                        clickedButton.disabled = true;
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
                        // Cek dulu apakah response-nya OK
                        if (response.ok) {
                            return response.json(); // Lanjut ke .then() berikutnya
                        }
                        // Jika tidak OK, parse error JSON-nya dan lempar ke .catch()
                        return response.json().then(errData => {
                            throw new Error(errData.error || 'Gagal menghapus item');
                        });
                    })
                    .then(result => {
                        if (result.success) {
                            window.location.reload();
                        } else {
                            throw new Error(result.error || 'Gagal menghapus item');
                        }
                    })
                    .catch(error => {
                        console.error('Error menghapus item:', error);
                        if (window.App) {
                            window.App.showAlert(error.message, 'error');
                        } else {
                            alert(error.message);
                        }
                    })
                    .finally(() => {
                        if (window.App) {
                            window.App.hideLoading(clickedButton, originalButtonText);
                        } else {
                            clickedButton.disabled = false;
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