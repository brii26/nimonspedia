document.addEventListener('DOMContentLoaded', () => {
    // ==================== STATE ====================
    const state = {
        currentStatus: window.sellerOrdersConfig?.currentStatus || null,
        currentSearch: window.sellerOrdersConfig?.currentSearch || '',
        currentPage: window.sellerOrdersConfig?.currentPage || 1,
        hasMore: window.sellerOrdersConfig?.hasMore ?? false,
        loading: false
    };

    // ==================== DOM ELEMENTS ====================
    const container = document.querySelector('.orders-container');
    const orderListContainer = document.getElementById('seller-order-list-container');
    const sentinel = document.getElementById('scroll-sentinel');
    const searchForm = document.querySelector('.search-form');
    const searchInput = searchForm?.querySelector('input[name="search"]');
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content ||
                      document.querySelector('input[name="csrf_token"]')?.value;

    // ==================== UTILITIES ====================
    const escapeHTML = (str) => {
        if (typeof str !== 'string' || !str) return '';
        return str.replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[m]);
    };

    const nl2br = (str) => {
        if (typeof str !== 'string' || !str) return '';
        return escapeHTML(str).replace(/(\r\n|\n\r|\r|\n)/g, '<br>');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatCurrency = (amount) => {
        return window.App?.formatCurrency?.(amount) || `Rp ${Number(amount).toLocaleString('id-ID')}`;
    };

    // ==================== BUILD ORDER CARD HTML ====================
    const buildOrderCardHTML = (order) => {
        const firstItem = order.items?.[0];
        const imagePath = firstItem?.main_image_path || 'product_images/default-product.svg';
        const statusClass = escapeHTML(order.status || '');
        const statusText = (order.status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        let itemsHtml = '';
        if (firstItem) {
            itemsHtml = `
                <div class="order-item-preview">
                    <img src="/storage/${escapeHTML(imagePath)}" 
                         alt="${escapeHTML(firstItem.product_name)}" 
                         class="order-item-thumbnail">
                    <div class="order-item-info">
                        <div class="order-item-name">${escapeHTML(firstItem.product_name)}</div>
                        <div class="order-item-qty">${escapeHTML(String(firstItem.quantity))} barang</div>
                        ${order.items.length > 1 ? `<div class="order-item-more">+${order.items.length - 1} produk lainnya</div>` : ''}
                    </div>
                </div>
            `;
        } else {
            itemsHtml = '<span style="color: #888; font-size: 0.9rem; padding: 1rem 0;">(Produk tidak ditemukan)</span>';
        }

        let actionButtons = `
            <button type="button" onclick="showOrderDetail(${order.order_id})" class="btn-detail">View Details</button>
        `;
        if (order.status === 'waiting_approval') {
            actionButtons += `
                <button type="button" onclick="approveOrder(${order.order_id})" id="btn-approve">Approve</button>
                <button type="button" onclick="showRejectModal(${order.order_id})" id="btn-reject">Reject</button>
            `;
        }
        if (order.status === 'approved') {
            actionButtons += `
                <button type="button" onclick="showDeliveryModal(${order.order_id})" class="btn-delivery">Set Delivery</button>
            `;
        }

        return `
            <article class="order-card" data-order-id="${order.order_id}">
                <header class="order-card-header">
                    <div>
                        <span class="order-card-store">Pembeli: <strong>${escapeHTML(order.buyer_name || 'N/A')}</strong></span>
                        <span class="order-id-display">Order ID: #${escapeHTML(String(order.order_id))}</span>
                    </div>
                    <div id="right-order-header-section">
                        <span class="order-card-date">${formatDate(order.created_at)}</span>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                </header>
                <div class="order-card-body">${itemsHtml}</div>
                <footer class="order-card-footer">
                    <div class="order-total">
                        <span>Total Belanja</span>
                        <strong>${formatCurrency(order.total_price)}</strong>
                    </div>
                    <div class="order-actions">${actionButtons}</div>
                </footer>
            </article>
        `;
    };

    // ==================== LOAD MORE ORDERS (INFINITE SCROLL) ====================
    const loadMoreOrders = async () => {
        if (state.loading || !state.hasMore) return;

        state.loading = true;
        if (sentinel) sentinel.classList.remove('hidden');

        const nextPage = state.currentPage + 1;
        const params = new URLSearchParams();
        params.set('page', nextPage);
        if (state.currentStatus) params.set('status', state.currentStatus);
        if (state.currentSearch) params.set('search', state.currentSearch);

        try {
            const response = await fetchXhr(`/seller/orders?${params.toString()}`, {
                method: 'GET',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const result = await response.json();

            if (result.success && Array.isArray(result.data)) {
                result.data.forEach(order => {
                    const html = buildOrderCardHTML(order);
                    orderListContainer.insertAdjacentHTML('beforeend', html);
                });

                state.currentPage = result.page;
                state.hasMore = result.has_more;

                if (!state.hasMore && sentinel) {
                    sentinel.classList.add('hidden');
                }
            }
        } catch (error) {
            console.error('Error loading more orders:', error);
        } finally {
            state.loading = false;
        }
    };

    // ==================== RESET AND RELOAD ====================
    const resetAndReload = async (status = null, search = '') => {
        state.currentStatus = status;
        state.currentSearch = search;
        state.currentPage = 1;
        state.hasMore = false;
        state.loading = true;

        if (orderListContainer) {
            orderListContainer.innerHTML = '<div class="empty-state"><p>Loading...</p></div>';
        }
        if (sentinel) sentinel.classList.add('hidden');

        const params = new URLSearchParams();
        params.set('page', '1');
        if (status) params.set('status', status);
        if (search) params.set('search', search);

        try {
            const response = await fetchXhr(`/seller/orders?${params.toString()}`, {
                method: 'GET',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const result = await response.json();

            if (result.success && Array.isArray(result.data)) {
                if (result.data.length === 0) {
                    const statusText = status ? ` dengan status '${status.replace(/_/g, ' ')}'` : '';
                    orderListContainer.innerHTML = `<div class="empty-state"><p>Tidak ada pesanan${statusText}.</p></div>`;
                } else {
                    orderListContainer.innerHTML = result.data.map(buildOrderCardHTML).join('');
                }

                state.currentPage = result.page;
                state.hasMore = result.has_more;

                if (state.hasMore && sentinel) {
                    sentinel.classList.remove('hidden');
                }

                // Update URL without reload
                const newUrl = `/seller/orders${params.toString() ? '?' + params.toString() : ''}`;
                history.pushState(null, '', newUrl);

                // Update active tab
                updateActiveTab(status);
            }
        } catch (error) {
            console.error('Error reloading orders:', error);
            if (orderListContainer) {
                orderListContainer.innerHTML = '<div class="empty-state"><p>Gagal memuat daftar pesanan. Coba lagi.</p></div>';
            }
        } finally {
            state.loading = false;
        }
    };

    const updateActiveTab = (status) => {
        const allTabs = container?.querySelectorAll('.status-tabs .tab');
        allTabs?.forEach(tab => {
            const tabStatus = tab.dataset.status || '';
            if (tabStatus === (status || '')) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    };

    // ==================== INTERSECTION OBSERVER ====================
    if (sentinel && orderListContainer) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && state.hasMore && !state.loading) {
                loadMoreOrders();
            }
        }, { threshold: 0.1 });

        observer.observe(sentinel);
    }

    // ==================== TAB CLICK HANDLER ====================
    if (container) {
        container.addEventListener('click', (e) => {
            const tab = e.target.closest('.status-tabs .tab');
            if (tab) {
                e.preventDefault();
                const status = tab.dataset.status || null;
                resetAndReload(status, state.currentSearch);
            }
        });
    }

    // ==================== SEARCH HANDLER ====================
    if (searchForm && searchInput) {
        const debouncedSearch = window.App?.debounce
            ? App.debounce(() => resetAndReload(state.currentStatus, searchInput.value), 500)
            : (() => {
                let timeout;
                return () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => resetAndReload(state.currentStatus, searchInput.value), 500);
                };
            })();

        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            resetAndReload(state.currentStatus, searchInput.value);
        });

        searchInput.addEventListener('input', debouncedSearch);
    }

    // ==================== MODALS ====================
    const showModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'flex';
    };

    window.closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    };

    // ==================== ORDER DETAIL ====================
    window.showOrderDetail = (orderId) => {
        const contentDiv = document.getElementById('order-detail-content');
        if (!contentDiv) return;

        showModal('detail-popup');
        contentDiv.innerHTML = '<p style="text-align: center;">Loading...</p>';

        fetchXhr(`/seller/orders/show?id=${orderId}&format=json`, {
            method: 'GET',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                const order = result.data;
                const itemsHtml = order.items.map(item => `
                    <li>${escapeHTML(item.product_name)} (x${item.quantity}) - ${formatCurrency(item.subtotal)}</li>
                `).join('');

                contentDiv.innerHTML = `
                    <div class="order-detail">
                        <div class="section">
                            <h4>Informasi Pembeli</h4>
                            <p><strong>Nama:</strong> ${escapeHTML(order.buyer_name || '')}</p>
                            <p><strong>Email:</strong> ${escapeHTML(order.buyer_email || '')}</p>
                            <p><strong>Alamat:</strong><br>${nl2br(order.buyer_address || '')}</p>
                        </div>
                        <div class="section">
                            <h4>Detail Item</h4>
                            <ul>${itemsHtml}</ul>
                            <p style="text-align: right; margin-top: 10px;">
                                <strong>Total: ${formatCurrency(order.total_price)}</strong>
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

    // ==================== APPROVE ORDER ====================
    window.approveOrder = (orderId) => {
        const onConfirm = () => {
            const formData = new URLSearchParams();
            formData.append('order_id', orderId);
            formData.append('csrf_token', csrfToken);

            fetchXhr('/seller/orders/approve', {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    App.showAlert('Order successfully approved!', 'success');
                    // Remove the order card from DOM or reload
                    const card = orderListContainer.querySelector(`[data-order-id="${orderId}"]`);
                    if (card) card.remove();
                } else {
                    AppError.show(result.message || 'Gagal menyetujui pesanan.');
                }
            })
            .catch(err => {
                console.error('Approve order error:', err);
                AppError.show('Terjadi kesalahan jaringan saat menyetujui.');
            });
        };

        AppConfirm.ask('Anda yakin ingin menyetujui (approve) pesanan ini?');
        document.addEventListener('confirm:ok', onConfirm, { once: true });
    };

    // ==================== REJECT MODAL ====================
    window.showRejectModal = (orderId) => {
        const orderIdInput = document.getElementById('reject-order-id');
        if (orderIdInput) orderIdInput.value = orderId;
        showModal('reject-popup');
        document.getElementById('reject-reason')?.focus();
    };

    const rejectForm = document.getElementById('reject-form');
    if (rejectForm) {
        rejectForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(rejectForm);
            const orderId = formData.get('order_id');
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
                    const card = orderListContainer.querySelector(`[data-order-id="${orderId}"]`);
                    if (card) card.remove();
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

    // ==================== DELIVERY MODAL ====================
    window.showDeliveryModal = (orderId) => {
        const orderIdInput = document.getElementById('delivery-order-id');
        if (orderIdInput) orderIdInput.value = orderId;
        showModal('delivery-popup');
        document.getElementById('delivery-time')?.focus();
    };

    const deliveryForm = document.getElementById('delivery-form');
    if (deliveryForm) {
        deliveryForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(deliveryForm);
            const orderId = formData.get('order_id');
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
                    const card = orderListContainer.querySelector(`[data-order-id="${orderId}"]`);
                    if (card) card.remove();
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