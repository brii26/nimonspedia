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
});