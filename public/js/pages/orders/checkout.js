// /public/js/pages/checkout.js

document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    
    const checkoutBtn = document.querySelector('.btn-checkout'); // Lebih aman pakai class
    const checkoutForm = document.getElementById('checkoutForm');

    // Helper untuk reset tombol jika error
    const resetButton = (btn, original) => {
        if (window.App && typeof window.App.hideLoading === 'function') {
            window.App.hideLoading(btn);
        } else if (btn) {
            btn.disabled = false;
            btn.textContent = original || 'Bayar Sekarang';
        }
    }

    if (!checkoutBtn || !checkoutForm) return;

    // Ambil tombol submit dari form
    const submitButton = checkoutForm.querySelector('button[type="submit"]');

    // Hentikan submit form biasa, kita akan pakai AJAX
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
    });

    // Pasang listener di tombol "Bayar Sekarang"
    submitButton.addEventListener('click', (e) => {
        e.preventDefault();
        const originalText = submitButton.textContent;
        if (submitButton.disabled) return;

        const onConfirm = () => {
            // Hapus listener 'confirm:cancel'
            document.removeEventListener('confirm:cancel', onCancel);

            if (window.App && typeof window.App.showLoading === 'function') {
                window.App.showLoading(submitButton, 'Memproses...');
            } else {
                submitButton.disabled = true;
                submitButton.textContent = 'Memproses...';
            }

            // Ambil form data
            const formData = new FormData(checkoutForm);
            
            window.fetchXhr('/orders/checkout', { 
                method: 'POST', 
                body: formData, 
                timeout: 15000
            })
            .then(response => {
                // Fallback untuk fetchXhr biasa
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    return response.json().then(data => ({ json: data, url: response.url }));
                }
                // Jika respons-nya bukan JSON (misal redirect), url-nya saja sudah cukup
                return { json: null, url: response.url };
            }).then(result => {
                const data = result.json; 
                
                // Jika server mengirim JSON berisi 'redirect'
                if (data && data.redirect) { window.location = data.redirect; return; }
                
                // Jika server mengirim JSON berisi 'error'
                const errorMsg = data ? (data.error || (Array.isArray(data.errors) && data.errors.length ? data.errors[0] : null)) : null;
                if (errorMsg) {
                    if (window.AppError && AppError.show) {
                        AppError.show(errorMsg);
                    } else if (window.App && App.showAlert) {
                        App.showAlert(errorMsg, 'error');
                    } else {
                        alert(errorMsg);
                    }
                    resetButton(submitButton, originalText);
                    return;
                }
                
                // Jika tidak ada error, dan server me-redirect kita (ini skenario sukses)
                if (result.url && result.url.includes('/orders')) { 
                    window.location = result.url; 
                } else { 
                    // Fallback jika terjadi sesuatu yang aneh
                    if (window.App && App.showAlert) {
                        window.App.showAlert('Checkout berhasil, tetapi gagal mengarahkan.', 'info');
                    }
                    window.location = '/orders'; // Paksa redirect
                }
            }).catch(err => {
                console.error('Checkout error', err);
                if (window.AppError && AppError.show) {
                    AppError.show('Terjadi kesalahan saat melakukan checkout.');
                } else if (window.App && App.showAlert) {
                    App.showAlert('Terjadi kesalahan saat melakukan checkout.', 'error');
                } else {
                    alert('Terjadi kesalahan saat melakukan checkout.');
                }
                resetButton(submitButton, originalText);
            });
            
        }; // Akhir onConfirm

        const onCancel = () => {
             // Hapus listener 'confirm:ok'
            document.removeEventListener('confirm:ok', onConfirm);
        };

        // Pasang listener di document
        document.addEventListener('confirm:ok', onConfirm, { once: true });
        document.addEventListener('confirm:cancel', onCancel, { once: true });
        
        // Panggil modal
        if (window.AppConfirm && typeof window.AppConfirm.ask === 'function') {
            window.AppConfirm.ask('Anda yakin ingin melanjutkan pembayaran? Saldo Anda akan dipotong.');
        } else {
            if (confirm('Anda yakin ingin melanjutkan pembayaran? Saldo Anda akan dipotong.')) {
                onConfirm();
            } else {
                onCancel();
            }
        }
    });
});