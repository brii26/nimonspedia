document.addEventListener('DOMContentLoaded', function() {
    const rejectForm = document.getElementById('reject-form');
    if (rejectForm) {
        rejectForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const form = new FormData(rejectForm);

            try {
                const res = await fetchXhr('/seller/orders/reject', {
                    method: 'POST',
                    body: form,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await res.json();

                if (data.success) {
                    closeModal('reject-popup');
                    App.showAlert('Order rejected successfully', 'success');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    App.showAlert(data.message || 'Failed to reject order', 'error');
                }
            } catch (err) {
                console.error('Error:', err);
                App.showAlert('Error rejecting order', 'error');
            }
        });
    }
});

function showOrderDetail(orderId) {
    const detPopup = document.getElementById('detail-popup');
    const content = document.getElementById('order-detail-content');
    detPopup.style.display = 'flex';
    content.innerHTML = 'Loading...';

    fetchXhr(`/seller/orders/show?id=${orderId}&format=json`, {
        method: 'GET',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const order = data.data;
                content.innerHTML = `
                    <div class="order-detail">
                        <div class="section">
                            <h4>Buyer Information</h4>
                            <p>Name: ${order.buyer_name}</p>
                            <p>Email: ${order.buyer_email}</p>
                            <p>Shipping Address: ${order.shipping_address}</p>
                        </div>
                        
                        <div class="section">
                            <h4>Order Information</h4>
                            <p>Order ID: #${order.order_id}</p>
                            <p>Date: ${new Date(order.created_at).toLocaleString()}</p>
                            <p>Status: ${order.status.replace('_', ' ').toUpperCase()}</p>
                            <p>Total: Rp ${order.total_price.toLocaleString()}</p>
                        </div>

                        <div class="section">
                            <h4>Products</h4>
                            <ul>
                                ${order.items.map(item => `
                                    <li>
                                        ${item.product_name} 
                                        (x${item.quantity}) - 
                                        Rp ${item.price_at_order.toLocaleString()}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>

                        ${order.status === 'rejected' ? `
                            <div class="section">
                                <h4>Rejection Reason</h4>
                                <p>${order.reject_reason}</p>
                            </div>
                        ` : ''}

                        ${order.status === 'on_delivery' ? `
                            <div class="section">
                                <h4>Delivery Information</h4>
                                <p>Delivery Date: ${new Date(order.delivery_time).toLocaleDateString()}</p>
                            </div>
                        ` : ''}
                    </div>
                `;
            } else {
                content.innerHTML = 'Error loading order details';
            }
        })
        .catch(err => {
            console.error('Error:', err);
            content.innerHTML = 'Error loading order details';
        });
}

function showRejectModal(orderId) {
    const input = document.getElementById('reject-order-id');
    if (input) input.value = orderId;
    const popup = document.getElementById('reject-popup');
    if (popup) popup.style.display = 'flex';
    setTimeout(() => document.getElementById('reject-reason')?.focus(), 50);
}

function showDeliveryModal(orderId) {
    document.getElementById('delivery-order-id').value = orderId;
    document.getElementById('delivery-popup').style.display = 'flex';
}

function closeModal(popupId) {
    document.getElementById(popupId).style.display = 'none';
}

function approveOrder(orderId) {
    const form = new FormData();
    form.append('order_id', orderId);
    form.append('csrf_token', document.querySelector('input[name="csrf_token"]').value);

    fetchXhr('/seller/orders/approve', {
        method: 'POST',
        body: form,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                App.showAlert('Order approved successfully', 'success');
            } else {
                App.showAlert(data.message || 'Failed to approve order', 'error');
            }
        })
        .catch(err => {
            console.error('Error:', err);
            App.showAlert('Error approving order', 'error');
        });
}

document.getElementById('delivery-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = new FormData(this);

    fetchXhr('/seller/orders/delivery', {
        method: 'POST',
        body: form,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeModal('delivery-popup');
                App.showAlert('Delivery time set successfully', 'success');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                App.showAlert(data.message || 'Failed to set delivery time', 'error');
            }
        })
        .catch(err => {
            console.error('Error:', err);
            App.showAlert('Error setting delivery time', 'error');
        });
});

window.onclick = function(event) {
    if (event.target.className === 'orders-popup') {
        event.target.style.display = 'none';
    }
};
