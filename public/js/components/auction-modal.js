document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('auction-modal');
    const backdrop = document.getElementById('auction-backdrop');
    const closeX = document.getElementById('auction-close-x');
    const cancelBtn = document.getElementById('auction-cancel-btn');
    const startButtons = document.querySelectorAll('.btn-start-auction');

    function openAuctionModal(btn) {
        const id = btn.dataset.productId;
        const name = btn.dataset.productName;
        const stock = btn.dataset.productStock;
        const price = btn.dataset.productPrice;

        document.getElementById('auction-product-id').value = id;
        document.getElementById('auction-product-name-display').textContent = name;
        document.getElementById('auction-start-price').value = price;

        const qtyInput = document.getElementById('auction-quantity');
        qtyInput.max = stock;
        qtyInput.value = 1; 
        document.getElementById('stock-hint').textContent = '(Max available: ' + stock + ')';

        modal.setAttribute('aria-hidden', 'false');
    }

    function closeAuctionModal() {
        modal.setAttribute('aria-hidden', 'true');
    }

    startButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            openAuctionModal(this);
        });
    });
    
    if(closeX) closeX.addEventListener('click', closeAuctionModal);
    if(cancelBtn) cancelBtn.addEventListener('click', closeAuctionModal);
    if(backdrop) backdrop.addEventListener('click', closeAuctionModal);
});