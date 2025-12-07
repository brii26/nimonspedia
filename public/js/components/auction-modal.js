document.addEventListener('DOMContentLoaded', function() {
    
    let currentProductId = null;
    let currentProductName = '';

    function closeAllModals() {
        document.querySelectorAll('.app-modal').forEach(m => {
            m.style.display = 'none';
            m.setAttribute('aria-hidden', 'true');
        });
    }

    function openModal(id) {
        closeAllModals();
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');
        }
    }

    function formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    // --- Monitor Logic ---
    function loadMonitorData(productId) {
        const tbody = document.getElementById('monitor-list-body');
        const emptyState = document.getElementById('monitor-empty');
        const loadingState = document.getElementById('monitor-loading');
        
        if (tbody) tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'none';
        if (loadingState) loadingState.style.display = 'block';

        fetchXhr(`/seller/auctions/list?product_id=${productId}`)
            .then(res => typeof res.json === 'function' ? res.json() : res)
            .then(response => {
                if (loadingState) loadingState.style.display = 'none';
                
                let auctions = [];
                if (response.data && Array.isArray(response.data)) {
                    auctions = response.data;
                } else if (Array.isArray(response)) {
                    auctions = response;
                }

                if (auctions.length === 0) {
                    if (emptyState) emptyState.style.display = 'block';
                    return;
                }

                auctions.forEach(auction => {
                    const row = document.createElement('tr');
                    const bidCount = parseInt(auction.bid_count || 0);
                    
                    let viewBtn = `<a href="/auction/live/${auction.auction_id}" class="btn btn-sm btn-primary">View</a>`;
                    let statusContent = '';

                    if (bidCount === 0 && auction.status !== 'closed') {
                        statusContent = `<button type="button" class="btn btn-sm btn-danger btn-cancel-auction" data-id="${auction.auction_id}">Cancel</button>`;
                    } else if (bidCount > 0) {
                        statusContent = `<span class="monitor-text-active">Running (${bidCount} Bids)</span>`;
                    } else {
                        statusContent = `<span class="monitor-text-closed">Ended</span>`;
                    }

                    const actionHtml = `<div class="monitor-action-group">${viewBtn}${statusContent}</div>`;

                    row.innerHTML = `
                        <td>${formatDateTime(auction.start_time)}</td>
                        <td>${auction.quantity}</td>
                        <td><span class="status-badge ${auction.status}">${auction.status}</span></td>
                        <td>${actionHtml}</td>
                    `;
                    if (tbody) tbody.appendChild(row);
                });
            })
            .catch(err => {
                console.error("Monitor error:", err);
                if (loadingState) loadingState.style.display = 'none';
                if (emptyState) {
                    emptyState.textContent = 'Gagal memuat data.';
                    emptyState.style.display = 'block';
                }
            });
    }

    function executeCancellation(auctionId) {
        
        fetchXhr('/seller/auctions/cancel', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ auction_id: auctionId })
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw new Error(err.message || 'Server Error'); });
            }
            return typeof res.json === 'function' ? res.json() : res;
        })
        .then(res => {
            if (res.success) {
                if (window.App && App.showAlert) {
                    App.showAlert('Auction Cancelled Successfully!', 'success');
                } else {
                    alert('Auction Cancelled Successfully!');
                }
                loadMonitorData(currentProductId);
            } else {
                throw new Error(res.message || 'Erro Cancelation.');
            }
        })
        .catch(err => {
            if (window.App && App.showAlert) {
                App.showAlert(err.message, 'danger');
            } else {
                alert("Error: " + err.message);
            }
        });
    }

    // --- Event Listeners ---
    document.body.addEventListener('click', function(e) {
        
        // Open Option Modal
        const auctionBtn = e.target.closest('.btn-auction-options');
        if (auctionBtn) {
            e.preventDefault();
            currentProductId = auctionBtn.dataset.id;
            currentProductName = auctionBtn.dataset.name;
            
            ['auction-options-product-name', 'monitor-product-name'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.textContent = currentProductName;
            });
            openModal('auction-options-modal');
            return;
        }

        // Choose Create
        if (e.target.closest('#opt-create-auction')) {
            const hiddenInput = document.getElementById('create-auction-product-id');
            if (hiddenInput) hiddenInput.value = currentProductId;
            openModal('create-auction-modal');
            return;
        }

        // Choose Monitor
        if (e.target.closest('#opt-monitor-auction')) {
            openModal('monitor-auction-modal');
            loadMonitorData(currentProductId);
            return;
        }

        // Cancel Action
        const cancelBtn = e.target.closest('.btn-cancel-auction');
        if (cancelBtn) {
            const id = cancelBtn.dataset.id;
            if (window.AppConfirm && typeof window.AppConfirm.ask === 'function') {
                window.AppConfirm.ask('U Sure Cancel Auction ??');
                document.addEventListener('confirm:ok', () => executeCancellation(id), { once: true });
            } else {
                if (confirm('Batalkan lelang ini?')) executeCancellation(id);
            }
            return;
        }

        if (e.target.closest('.app-modal-close') || e.target.closest('.app-modal-close-btn') || e.target.classList.contains('app-modal-backdrop')) {
            closeAllModals();
        }
    });
});