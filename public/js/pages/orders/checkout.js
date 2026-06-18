// /public/js/pages/checkout.js

document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    
    const editAddressBtn = document.getElementById('edit-address-btn');
    const addressDisplayGroup = document.getElementById('address-display-group');
    const addressEditGroup = document.getElementById('address-edit-group');
    
    // Ambil elemen-elemen kunci
    const staticContentDiv = document.getElementById('static-address-content');
    const hiddenInput = document.getElementById('shipping_address_input');
    const editorElement = document.getElementById('address-editor');
    
    if (editAddressBtn && addressDisplayGroup && addressEditGroup && editorElement) {
        
        // 1. Inisialisasi Quill Editor
        const quill = createEditor('#address-editor', null); 

        // 2. Tombol "Edit Address" diklik
        editAddressBtn.addEventListener('click', () => {
            // Ambil alamat TERBARU dari hidden input (sumber kebenaran)
            const currentAddress = hiddenInput.value;
            
            // Set konten Quill dengan alamat terbaru
            // Kita perlu konversi \n dari htmlspecialchars menjadi <p> untuk Quill
            const addressHtml = '<p>' + currentAddress.replace(/\n/g, '</p><p>') + '</p>';
            quill.root.innerHTML = addressHtml;

            // Tampilkan editor
            addressDisplayGroup.style.display = 'none';
            addressEditGroup.style.display = 'block';
            
            if (editorElement) {
                editorElement.classList.remove('is-invalid');
            }
            quill.focus();
        });

        // 3. Tombol "Cancel" diklik
        const cancelBtn = document.getElementById('cancel-address-btn');
        cancelBtn.addEventListener('click', () => {
            addressEditGroup.style.display = 'none';
            addressDisplayGroup.style.display = 'block';
        });

        // 4. Tombol "Save Address" diklik
        const saveBtn = document.getElementById('save-address-btn');
        saveBtn.addEventListener('click', () => {
            
            // Validasi 10 karakter
            const plainText = quill.getText().trim();
            if (plainText.length < 10) {
                if(window.App) App.showAlert('Shipping address must be at least 10 characters.', 'error');
                if (editorElement) {
                    editorElement.classList.add('is-invalid');
                }
                return;
            }

            // Ambil konten dari Quill
            const newAddressHtml = quill.root.innerHTML;
            
            const newAddressText = quill.getText().trim();
            
            // Perbarui tampilan statis (div)
            staticContentDiv.innerHTML = newAddressHtml;
            
            // Perbarui "source of truth" (hidden input)
            hiddenInput.value = newAddressText; 
            
            // Kembalikan tampilan
            addressEditGroup.style.display = 'none';
            addressDisplayGroup.style.display = 'block';
        });
    }

    const checkoutBtn = document.querySelector('.btn-checkout'); // Lebih aman pakai class
    const checkoutForm = document.getElementById('checkoutForm');

    // Helper untuk reset tombol jika error
    const resetButton = (btn, original) => {
        if (window.App && typeof window.App.hideLoading === 'function') {
            window.App.hideLoading(btn);
        } else if (btn) {
            btn.disabled = false;
            btn.textContent = original || 'Pay Now';
        }
    }

    if (!checkoutBtn || !checkoutForm) return;

    // Ambil tombol submit dari form
    const submitButton = checkoutForm.querySelector('button[type="submit"]');

    // Hentikan submit form biasa, kita akan pakai AJAX
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
    });

    // Pasang listener di tombol "Pay Now"
    submitButton.addEventListener('click', (e) => {
        e.preventDefault();
        const originalText = submitButton.textContent;
        if (submitButton.disabled) return;

        const onConfirm = () => {
            // Delete listener 'confirm:cancel'
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
                        window.App.showAlert('Checkout successful, but failed to redirect.', 'info');
                    }
                    window.location = '/orders'; // Paksa redirect
                }
            }).catch(err => {
                console.error('Checkout error', err);
                if (window.AppError && AppError.show) {
                    AppError.show('An error occurred during checkout.');
                } else if (window.App && App.showAlert) {
                    App.showAlert('An error occurred during checkout.', 'error');
                } else {
                    alert('An error occurred during checkout.');
                }
                resetButton(submitButton, originalText);
            });
            
        }; // Akhir onConfirm

        const onCancel = () => {
             // Delete listener 'confirm:ok'
            document.removeEventListener('confirm:ok', onConfirm);
        };

        // Pasang listener di document
        document.addEventListener('confirm:ok', onConfirm, { once: true });
        document.addEventListener('confirm:cancel', onCancel, { once: true });
        
        // Panggil modal
        if (window.AppConfirm && typeof window.AppConfirm.ask === 'function') {
            window.AppConfirm.ask('Are you sure you want to proceed? Your balance will be deducted.');
        } else {
            if (confirm('Are you sure you want to proceed? Your balance will be deducted.')) {
                onConfirm();
            } else {
                onCancel();
            }
        }
    });
});