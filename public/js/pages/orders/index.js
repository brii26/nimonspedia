/**
 * Orders Page with Infinite Scroll
 */
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.orders-container');
    const orderList = document.getElementById('order-list');

    if (!container || !orderList) return;

    // State from server-rendered config
    const config = window.ordersConfig || {};
    let currentPage = config.currentPage || 1;
    let hasMore = config.hasMore || false;
    let currentStatus = config.currentStatus || 'all';
    let isLoading = false;

    // Get or create sentinel element
    function getSentinel() {
        let sentinel = document.getElementById('scroll-sentinel');
        if (!sentinel && hasMore) {
            sentinel = document.createElement('div');
            sentinel.id = 'scroll-sentinel';
            sentinel.className = 'scroll-sentinel';
            sentinel.innerHTML = '<div class="loading-spinner"></div>';
            orderList.parentElement.appendChild(sentinel);
        }
        return sentinel;
    }

    // Remove sentinel
    function removeSentinel() {
        const sentinel = document.getElementById('scroll-sentinel');
        if (sentinel) sentinel.remove();
    }

    // Build URL with current params
    function buildUrl(page) {
        const params = new URLSearchParams();
        if (currentStatus && currentStatus !== 'all') {
            params.set('status', currentStatus);
        }
        params.set('page', page);
        return '/orders?' + params.toString();
    }

    // Render order card from data
    function renderOrderCard(order) {
        const firstItem = order.items && order.items[0];
        const itemsCount = order.items ? order.items.length : 0;
        const statusLabel = order.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        const card = document.createElement('article');
        card.className = 'order-card';
        card.dataset.orderId = order.order_id;
        
        card.innerHTML = `
            <header class="order-card-header">
                <span class="order-card-store">Store: <strong>${escapeHtml(order.store_name || 'N/A')}</strong></span>
                <span class="order-card-date">${formatDate(order.created_at)}</span>
                <span class="status-badge ${order.status}">${statusLabel}</span>
            </header>
            <div class="order-card-body">
                ${firstItem ? `
                    <div class="order-item-preview">
                        <img src="/storage/${escapeHtml(firstItem.main_image_path || 'product_images/default-product.svg')}" 
                             alt="${escapeHtml(firstItem.product_name)}" 
                             class="order-item-thumbnail">
                        <div class="order-item-info">
                            <div class="order-item-name">${escapeHtml(firstItem.product_name)}</div>
                            <div class="order-item-qty">${firstItem.quantity} items</div>
                            ${itemsCount > 1 ? `<div class="order-item-more">+${itemsCount - 1} more products</div>` : ''}
                        </div>
                    </div>
                ` : '<span style="color: #888; font-size: 0.9rem;">(Product not found)</span>'}
            </div>
            <footer class="order-card-footer">
                <div class="order-total">
                    <span>Total</span>
                    <strong>${formatCurrency(order.total_price)}</strong>
                </div>
                <div class="order-actions">
                    <a href="/orders/show?id=${order.order_id}" class="btn btn-detail">View Detail</a>
                    ${order.status === 'on_delivery' ? `
                        <form action="/orders/confirm-received" method="POST" data-form="confirm-received" style="display: inline;">
                            <input type="hidden" name="csrf_token" value="${getCSRFToken()}">
                            <input type="hidden" name="order_id" value="${order.order_id}">
                            <button type="submit" class="btn btn-success confirm-received-btn">Confirm Received</button>
                        </form>
                    ` : ''}
                </div>
            </footer>
        `;
        
        return card;
    }

    // Load more orders via AJAX
    async function loadMore() {
        if (isLoading || !hasMore) return;
        
        isLoading = true;
        const nextPage = currentPage + 1;
        const url = buildUrl(nextPage);

        try {
            const response = await fetchXhr(url, {
                method: 'GET',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            
            const data = await response.json();
            
            if (data.success && data.data) {
                data.data.forEach(order => {
                    orderList.appendChild(renderOrderCard(order));
                });
                
                currentPage = data.page;
                hasMore = data.has_more;
                
                if (!hasMore) {
                    removeSentinel();
                }
            }
        } catch (error) {
            console.error('Error loading more orders:', error);
        } finally {
            isLoading = false;
        }
    }

    // Reset and reload with new status filter
    async function resetAndLoad() {
        isLoading = true;
        currentPage = 1;
        
        const url = buildUrl(1);
        orderList.style.opacity = '0.5';
        removeSentinel();

        try {
            const response = await fetchXhr(url, {
                method: 'GET',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            
            const data = await response.json();
            
            orderList.innerHTML = '';
            
            if (data.success && data.data && data.data.length > 0) {
                data.data.forEach(order => {
                    orderList.appendChild(renderOrderCard(order));
                });
                
                hasMore = data.has_more;
                if (hasMore) {
                    getSentinel();
                    setupObserver();
                }
            } else {
                const statusText = currentStatus !== 'all' ? ` dengan status '${currentStatus}'` : '';
                orderList.innerHTML = `<div class="empty-state"><p>No orders${statusText}.</p></div>`;
                hasMore = false;
            }

            history.pushState(null, '', url);
            
        } catch (error) {
            console.error('Error fetching orders:', error);
            orderList.innerHTML = '<div class="empty-state"><p>Failed to load orders.</p></div>';
        } finally {
            orderList.style.opacity = '1';
            isLoading = false;
        }
    }

    // IntersectionObserver for infinite scroll
    let observer = null;
    function setupObserver() {
        if (observer) observer.disconnect();
        
        const sentinel = getSentinel();
        if (!sentinel) return;

        observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isLoading && hasMore) {
                loadMore();
            }
        }, { rootMargin: '100px' });

        observer.observe(sentinel);
    }

    // Tab click handler
    container.addEventListener('click', (e) => {
        const tab = e.target.closest('.status-tabs .tab');
        if (tab) {
            e.preventDefault();
            
            // Update active tab UI
            container.querySelectorAll('.status-tabs .tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            currentStatus = tab.dataset.status || 'all';
            resetAndLoad();
        }
    });

    // Confirm received handler (delegated)
    container.addEventListener('submit', (e) => {
        const form = e.target.closest('form[data-form="confirm-received"]');
        if (!form) return;

        e.preventDefault();

        const submitButton = form.querySelector('.confirm-received-btn');
        if (!submitButton) return;

        if (typeof AppConfirm !== 'undefined') {
            AppConfirm.ask('Are you sure you have received this order?');

            const handleConfirmOk = () => {
                processConfirmReceived(form, submitButton);
                document.removeEventListener('confirm:cancel', handleConfirmCancel);
            };

            const handleConfirmCancel = () => {
                document.removeEventListener('confirm:ok', handleConfirmOk);
            };

            document.addEventListener('confirm:ok', handleConfirmOk, { once: true });
            document.addEventListener('confirm:cancel', handleConfirmCancel, { once: true });
        } else {
            if (confirm('Are you sure you have received this order?')) {
                processConfirmReceived(form, submitButton);
            }
        }
    });

    async function processConfirmReceived(form, submitButton) {
        if (typeof App !== 'undefined') App.showLoading(submitButton, 'Memproses...');
        
        const formData = new FormData(form);
        const actionUrl = form.getAttribute('action');

        try {
            const response = await fetch(actionUrl, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();

            if (response.ok) {
                if (typeof App !== 'undefined') {
                    App.showAlert(result.message || 'Order confirmed', 'success');
                }
                
                const orderCard = form.closest('.order-card');
                if (orderCard) {
                    const statusBadge = orderCard.querySelector('.status-badge');
                    if (statusBadge) {
                        statusBadge.textContent = 'Received';
                        statusBadge.className = 'status-badge received';
                    }
                }
                form.remove();
            } else {
                if (typeof App !== 'undefined') {
                    App.showAlert(result.message || 'Failed to process request.', 'error');
                    App.hideLoading(submitButton);
                }
            }
        } catch (error) {
            console.error('Error confirming order:', error);
            if (typeof App !== 'undefined') {
                App.showAlert('Failed to connect to server.', 'error');
                App.hideLoading(submitButton);
            }
        }
    }

    // Utility functions
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function formatCurrency(amount) {
        if (amount == null) return 'Rp 0';
        return 'Rp ' + Number(amount).toLocaleString('id-ID');
    }

    function getCSRFToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }

    // Initialize observer if has more
    if (hasMore) {
        setupObserver();
    }
});