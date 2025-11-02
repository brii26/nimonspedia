document.addEventListener('DOMContentLoaded', () => {

    // === BAGIAN 1: LOGIKA AJAX UNTUK FILTER/PAGINASI ===
    const container = document.querySelector('.orders-container');
    const orderListContainer = document.getElementById('seller-order-list-container'); 

    /**
     * Fungsi inti untuk fetch order list via AJAX
     * (Sekarang menangani error-nya sendiri)
     */
    const fetchOrders = (url) => {
        if (!orderListContainer) return; // Guard clause
        
        orderListContainer.style.opacity = '0.5';

        // fetchXhr mengembalikan promise
        return fetchXhr(url, {
            method: 'GET',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.html) {
                orderListContainer.innerHTML = data.html;
                history.pushState(null, '', url); 
                updateActiveTab(url);
            } else {
                // Jika server merespon tapi tidak ada HTML
                throw new Error('Invalid response from server.');
            }
        })
        .catch(error => {
            // Tangani error fetchOrders DI SINI, jangan di-throw
            console.error('Error fetching orders:', error);
            if (orderListContainer) {
                orderListContainer.innerHTML = '<div class="empty-state"><p>Gagal memuat daftar pesanan. Coba lagi.</p></div>';
            }
        })
        .finally(() => {
            if (orderListContainer) {
                orderListContainer.style.opacity = '1';
            }
        });
    };

    /**
     * Helper untuk update tab status yang 'active'
     */
    const updateActiveTab = (url) => {
        const urlParams = new URL(url, window.location.origin).searchParams;
        const newStatus = urlParams.get('status') || 'all'; 
        
        const allTabs = container.querySelectorAll('.status-tabs .tab');
        
        allTabs.forEach(tab => {
            const tabUrl = new URL(tab.href);
            const tabStatus = tabUrl.searchParams.get('status') || 'all';
            
            if (tabStatus === 'all' && newStatus === 'all' && !tab.href.includes('?status')) {
                 tab.classList.add('active');
            } else if (tabStatus === newStatus && tab.href.includes(newStatus)) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    };

    // --- Event Listeners untuk Navigasi ---
    if (container && orderListContainer) {
        // 1. Klik pada Status Tabs
        container.addEventListener('click', (e) => {
            const tab = e.target.closest('.status-tabs .tab');
            if (tab) {
                e.preventDefault(); 
                fetchOrders(tab.getAttribute('href'));
            }
        });

        // 2. Klik pada Pagination Links
        orderListContainer.addEventListener('click', (e) => {
            const paginationLink = e.target.closest('.pagination a');
            if (paginationLink) {
                e.preventDefault(); 
                fetchOrders(paginationLink.getAttribute('href'));
            }
        });

        // 3. Submit pada Search Form
        const searchForm = document.querySelector('.search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault(); 
                const formData = new FormData(searchForm);
                const params = new URLSearchParams(formData);
                params.delete('page'); 
                
                const url = `${searchForm.action}?${params.toString()}`;
                fetchOrders(url);
            });
        }
    }

    // === BAGIAN 2: LOGIKA AKSI (APPROVE, REJECT, DETAIL) ===
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                      document.querySelector('input[name="csrf_token"]')?.value;

    const showModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'flex';
    };

    window.closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    };
    
    // Helper untuk nl2br di JS
    const nl2br = (str) => {
        if (typeof str !== 'string' || !str) return '';
        return str.replace(/(\r\n|\n\r|\r|\n)/g, '<br>');
    };

    window.showOrderDetail = (orderId) => {
        const modalId = 'detail-popup';
        const contentDiv = document.getElementById('order-detail-content');
        if (!contentDiv) return;

        showModal(modalId);
        contentDiv.innerHTML = '<p style="text-align: center;">Loading...</p>';

        fetchXhr(`/seller/orders/show?id=${orderId}&format=json`, {
            method: 'GET',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                const order = result.data;
                let itemsHtml = order.items.map(item => `
                    <li>
                        ${item.product_name} (x${item.quantity}) - ${App.formatCurrency(item.subtotal)}
                    </li>
                `).join('');

                contentDiv.innerHTML = `
                    <div class="order-detail">
                        <div class="section">
                            <h4>Informasi Pembeli</h4>
                            <p><strong>Nama:</strong> ${order.buyer_name || ''}</p>
                            <p><strong>Email:</strong> ${order.buyer_email || ''}</p>
                            <p><strong>Alamat:</strong><br>${nl2br(order.buyer_address || '')}</p>
                        </div>
                        <div class="section">
                            <h4>Detail Item</h4>
                            <ul>${itemsHtml}</ul>
                            <p style="text-align: right; margin-top: 10px;">
                                <strong>Total: ${App.formatCurrency(order.total_price)}</strong>
                            </p>
                        </div>
                    </div>
                `;
            } else {
                contentDiv.innerHTML = `<p style="text-align: center; color: red;">Gagal memuat detail pesanan.</p>`;
            }
        })
        .catch(err => {
            console.error('Fetch order detail error:', err);
            contentDiv.innerHTML = `<p style="text-align: center; color: red;">Terjadi kesalahan: ${err.message}</p>`;
        });
    };

    /**
     * [PERBAIKAN] Fungsi Approve dengan promise chain yang benar
     */
    window.approveOrder = (orderId) => {
        const onConfirm = () => {
            const formData = new URLSearchParams();
            formData.append('order_id', orderId);
            formData.append('csrf_token', csrfToken);

            // Promise 1: Approve Order
            fetchXhr('/seller/orders/approve', {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    // SUKSES: Tampilkan toast
                    App.showAlert('Order successfully approved!', 'success');
                    
                    // Promise 2: Refresh list (fire-and-forget)
                    // Kita tidak me-return promise ini, sehingga error
                    // di sini tidak akan memicu .catch() di bawah.
                    fetchOrders(window.location.href); 
                } else {
                    // Jika backend merespon { success: false }
                    AppError.show(result.message || 'Gagal menyetujui pesanan.');
                }
            })
            .catch(err => {
                // Catch HANYA untuk error dari fetch 'approve'
                console.error('Approve order error:', err);
                AppError.show('Terjadi kesalahan jaringan saat menyetujui.');
            });
        };

        AppConfirm.ask('Anda yakin ingin menyetujui (approve) pesanan ini?');
        document.addEventListener('confirm:ok', onConfirm, { once: true });
    };

    // ... (Sisa fungsi showRejectModal dan showDeliveryModal tetap sama) ...
    window.showRejectModal = (orderId) => {
        const orderIdInput = document.getElementById('reject-order-id');
        if (orderIdInput) orderIdInput.value = orderId;
        showModal('reject-popup');
        document.getElementById('reject-reason').focus();
    };

    window.showDeliveryModal = (orderId) => {
        const orderIdInput = document.getElementById('delivery-order-id');
        if (orderIdInput) orderIdInput.value = orderId;
        showModal('delivery-popup');
        document.getElementById('delivery-time').focus();
    };

    // ... (Sisa event listener untuk form reject dan delivery tetap sama) ...
    const rejectForm = document.getElementById('reject-form');
    if (rejectForm) {
        rejectForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(rejectForm);
            const submitBtn = rejectForm.querySelector('button[type="submit"]');
            App.showLoading(submitBtn, 'Rejecting...');

            fetchXhr('/seller/orders/reject', {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(response => response.json())
            .then(result => {
                App.hideLoading(submitBtn);
                if (result.success) {
                    closeModal('reject-popup');
                    App.showAlert('Order successfully rejected.', 'success');
                    fetchOrders(window.location.href); // Refresh list
                    rejectForm.reset();
                } else {
                    App.showAlert(result.message || 'Failed to reject order.', 'error');
                }
            })
            .catch(err => {
                App.hideLoading(submitBtn);
                App.showAlert(`Network error: ${err.message}`, 'error');
            });
        });
    }

    const deliveryForm = document.getElementById('delivery-form');
    if (deliveryForm) {
        deliveryForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(deliveryForm);
            const submitBtn = deliveryForm.querySelector('button[type="submit"]');
            App.showLoading(submitBtn, 'Saving...');

            fetchXhr('/seller/orders/delivery', {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(response => response.json())
            .then(result => {
                App.hideLoading(submitBtn);
                if (result.success) {
                    closeModal('delivery-popup');
                    App.showAlert('Delivery time set.', 'success');
                    fetchOrders(window.location.href); // Refresh list
                    deliveryForm.reset();
                } else {
                    App.showAlert(result.message || 'Failed to set delivery time.', 'error');
                }
            })
            .catch(err => {
                App.hideLoading(submitBtn);
                App.showAlert(`Network error: ${err.message}`, 'error');
            });
        });
    }
});