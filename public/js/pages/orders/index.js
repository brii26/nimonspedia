document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.orders-container');
    const orderListContainer = document.getElementById('order-list-container');

    if (!container || !orderListContainer) return;

    const fetchOrders = (url) => {
        orderListContainer.style.opacity = '0.5';

        fetchXhr(url, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.html) {
                orderListContainer.innerHTML = data.html;
                history.pushState(null, '', url);
                updateActiveTab(url); 
            }
        })
        .catch(error => {
            console.error('Error fetching orders:', error);
            orderListContainer.innerHTML = '<div class="empty-state"><p>Gagal memuat pesanan. Coba lagi.</p></div>';
        })
        .finally(() => {
            orderListContainer.style.opacity = '1';
        });
    };

    const updateActiveTab = (url) => {
        const urlParams = new URL(url, window.location.origin).searchParams;
        const newStatus = urlParams.get('status') || 'all';
        const allTabs = container.querySelectorAll('.status-tabs .tab');
        
        allTabs.forEach(tab => {
            const tabUrl = new URL(tab.href);
            const tabStatus = tabUrl.searchParams.get('status') || 'all';
            
            if (tabStatus === newStatus) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    };

    container.addEventListener('click', (e) => {
        const tab = e.target.closest('.status-tabs .tab');
        if (tab) {
            e.preventDefault();
            const url = tab.getAttribute('href');
            fetchOrders(url);
        }
    });

    orderListContainer.addEventListener('click', (e) => {
        const paginationLink = e.target.closest('.pagination-item');
        if (paginationLink) {
            e.preventDefault();
            const url = paginationLink.getAttribute('href');
            fetchOrders(url);
        }
    });

    orderListContainer.addEventListener('submit', (e) => {
        const form = e.target.closest('form[data-form="confirm-received"]');
        if (!form) {
            return;
        }

        e.preventDefault();

        const submitButton = form.querySelector('.confirm-received-btn');
        if (!submitButton) return;

        AppConfirm.ask('Apakah Anda yakin sudah menerima pesanan ini?');

        const handleConfirmOk = () => {
            App.showLoading(submitButton, 'Memproses...');
            const formData = new FormData(form);
            const actionUrl = form.getAttribute('action');

            App.request(actionUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                return response.json().then(data => ({
                    ok: response.ok,
                    data: data
                }));
            })
            .then(result => {
                if (result.ok) {
                    App.showAlert(result.data.message, 'success');
                    const orderCard = form.closest('.order-card');
                    if (orderCard) {
                        const statusBadge = orderCard.querySelector('.status-badge');
                        if (statusBadge) {
                            statusBadge.textContent = 'Completed';
                            statusBadge.className = 'status-badge completed';
                        }
                    }
                    form.remove();
                } else {
                    App.showAlert(result.data.message || 'Gagal memproses permintaan.', 'error');
                    App.hideLoading(submitButton);
                }
            })
            .catch(error => {
                console.error('Error confirming order:', error);
                App.showAlert('Gagal terhubung ke server. Coba lagi.', 'error');
                if (submitButton) {
                    App.hideLoading(submitButton);
                }
            })
            .finally(() => {
                document.removeEventListener('confirm:cancel', handleConfirmCancel);
            });
        };

        const handleConfirmCancel = () => {
            document.removeEventListener('confirm:ok', handleConfirmOk);
        };

        document.addEventListener('confirm:ok', handleConfirmOk, { once: true });
        document.addEventListener('confirm:cancel', handleConfirmCancel, { once: true });
    });
});