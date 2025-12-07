document.addEventListener('DOMContentLoaded', () => {
    const pageContainer = document.querySelector('.seller-product-page');
    if (!pageContainer) return;

    // ambil get request
    const qp = new URLSearchParams(window.location.search);
    const status = qp.get('status');
    const error = qp.get('error');

    if (status === 'product_created') App.showAlert('Product created successfully!', 'success');
    else if (status === 'product_updated') App.showAlert('Product updated successfully!', 'success');
    else if (status === 'product_deleted') App.showAlert('Product deleted successfully!', 'success');
    else if (status === 'auction_created') App.showAlert('Auction scheduled successfully!', 'success');
    
    if (error) App.showAlert(error, 'danger');

    // Clean URL
    if (status || error) {
        if (status) qp.delete('status');
        if (error) qp.delete('error');
        history.replaceState(null, '', window.location.pathname + (qp.toString() ? '?' + qp.toString() : ''));
    }

    // AJAX filtering
    const fetchAndSwap = (url) => {
        const contentTarget = pageContainer.querySelector('.product-grid-container');
        if (!contentTarget) return Promise.reject('Missing content target');

        contentTarget.style.opacity = '0.5';

        fetchXhr(url, { method: 'GET' })
            .then(response => {
                const htmlContent = response.html || response;
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlContent;

                const newGrid = tempDiv.querySelector('.product-grid-container');
                const newPagination = tempDiv.querySelector('.pagination');

                if (newGrid) contentTarget.innerHTML = newGrid.innerHTML;
                
                const existingPagination = pageContainer.querySelector('.pagination');
                if (newPagination && existingPagination) existingPagination.replaceWith(newPagination);
                else if (newPagination) contentTarget.after(newPagination);
                else if (existingPagination) existingPagination.remove();

                contentTarget.style.opacity = '1';
                history.pushState(null, '', url);
            })
            .catch(err => {
                console.error(err);
                contentTarget.style.opacity = '1';
                App.showAlert('Failed to refresh products.', 'danger');
            });
    };

    const urlFromForm = (page = 1) => {
        const form = document.getElementById('product-filter-form');
        const formData = new FormData(form);
        const params = new URLSearchParams(formData);
        params.set('page', page);
        return `${form.action}?${params.toString()}`;
    };

    pageContainer.addEventListener('click', (e) => {
        // Pagination
        if (e.target.matches('.pagination a')) {
            e.preventDefault();
            fetchAndSwap(e.target.href);
            return;
        }

        // Reset Filter
        if (e.target.closest('.reset-group a')) {
            e.preventDefault();
            const resetBtn = e.target.closest('.reset-group a');
            document.querySelectorAll('#product-filter-form input, #product-filter-form select').forEach(el => {
                if (el.tagName === 'SELECT') el.selectedIndex = 0;
                else el.value = '';
            });
            fetchAndSwap(resetBtn.href);
            return;
        }

        // Delete Confirmation
        const deleteButton = e.target.closest('form[action="/seller/products/delete"] button[type="submit"]');
        if (deleteButton) {
            e.preventDefault();
            const form = deleteButton.closest('form');
            
            if (window.AppConfirm && typeof window.AppConfirm.ask === 'function') {
                window.AppConfirm.ask('Are you sure you want to delete this product?');
                document.addEventListener('confirm:ok', function() {
                    if (window.App && App.showLoading) App.showLoading(deleteButton, 'Deleting...');
                    form.submit();
                }, { once: true });
            } else {
                if(confirm('Are you sure you want to delete?')) form.submit();
            }
        }
    });

    // Filter Form Input Events
    const filterForm = document.getElementById('product-filter-form');
    if (filterForm) {
        let timeout = null;
        filterForm.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT') {
                clearTimeout(timeout);
                timeout = setTimeout(() => fetchAndSwap(urlFromForm(1)), 500);
            }
        });
        filterForm.addEventListener('change', (e) => {
            if (e.target.tagName === 'SELECT') fetchAndSwap(urlFromForm(1));
        });
    }
});