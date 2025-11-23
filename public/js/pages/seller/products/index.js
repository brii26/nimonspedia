document.addEventListener('DOMContentLoaded', () => {
    const pageContainer = document.querySelector('.seller-product-page');
    if (!pageContainer) return;

    const qp = new URLSearchParams(window.location.search);
    const status = qp.get('status');
    if (status === 'product_created') App.showAlert('Product created successfully!', 'success');
    else if (status === 'product_updated') App.showAlert('Product updated successfully!', 'success');
    else if (status === 'product_deleted') App.showAlert('Product deleted successfully!', 'success');
    if (status) {
        qp.delete('status');
        history.replaceState(
            null,
            '',
            window.location.pathname + (qp.toString() ? '?' + qp.toString() : '')
        );
    }

    const fetchAndSwap = (url) => {
        const contentTarget = pageContainer.querySelector('.product-grid-container');
        if (!contentTarget) {
            console.error('AJAX Error: Could not find .product-grid-container');
            return Promise.reject('Missing content target');
        }

        contentTarget.style.opacity = '0.5';

        return fetchXhr(url, { method: 'GET', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then((r) => r.text())
            .then((t) => {
                let html = '';
                try {
                    const payload = JSON.parse(t);
                    html = payload?.html || '';
                } catch {
                    html = t;
                }

                if (html) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    const newContent = doc.querySelector('.product-grid-container');

                    if (newContent) {
                        contentTarget.innerHTML = newContent.innerHTML;
                    } else {
                        contentTarget.innerHTML = html;
                    }

                    history.pushState(null, '', url);
                }
            })
            .catch((err) => {
                console.error('Fetch error:', err);
                App.showAlert('Error loading products.', 'danger');
            })
            .finally(() => {
                if (contentTarget) contentTarget.style.opacity = '1';
            });
    };

    const urlFromForm = (page = 1) => {
        const form = pageContainer.querySelector('#product-filter-form');
        if (!form) return;
        const params = new URLSearchParams(new FormData(form));
        params.set('page', String(page));
        return `${form.action}?${params.toString()}`;
    };

    const debouncedReload = App.debounce
        ? App.debounce(() => fetchAndSwap(urlFromForm(1)), 350)
        : () => fetchAndSwap(urlFromForm(1));

    pageContainer.addEventListener('input', (e) => {
        if (e.target && e.target.id === 'search-input') {
            debouncedReload();
        }
    });

    pageContainer.addEventListener('change', (e) => {
        const id = e.target && e.target.id;
        if (id === 'filter-category' || id === 'sort-select' || id === 'filter-perPage') {
            fetchAndSwap(urlFromForm(1));
        }
    });

    pageContainer.addEventListener('click', (e) => {
        const paginationLink = e.target.closest('#products-pagination a');
        if (paginationLink) {
            e.preventDefault();
            fetchAndSwap(paginationLink.getAttribute('href'));
            return;
        }

        const resetButton = e.target.closest('#reset-filter-btn');
        if (resetButton) {
            e.preventDefault();
            
            const searchInput = pageContainer.querySelector('#search-input');
            const categoryInput = pageContainer.querySelector('#filter-category');
            const sortInput = pageContainer.querySelector('#sort-select');
            const perPageInput = pageContainer.querySelector('#filter-perPage');

            if (searchInput) searchInput.value = '';
            if (categoryInput) categoryInput.value = '';
            if (sortInput) sortInput.value = '';
            if (perPageInput) perPageInput.value = '8';

            fetchAndSwap(urlFromForm(1));
            return;
        }

        if (e.target.closest('.go-back')) {
            window.location.href = '/';
            return;
        }

        const deleteButton = e.target.closest('form[action="/seller/products/delete"] button[type="submit"]');
        if (deleteButton) {
            e.preventDefault();
            const form = deleteButton.closest('form');
            if (!form) return;

            if (window.AppConfirm && typeof window.AppConfirm.ask === 'function') {
                window.AppConfirm.ask('Are you sure you want to delete this product?');

                document.addEventListener('confirm:ok', function onConfirm() {
                    if (window.App && App.showLoading) {
                        App.showLoading(deleteButton, 'Deleting...');
                    }
                    form.submit();
                }, { once: true });

                document.addEventListener('confirm:cancel', function onCancel() {
                }, { once: true });

            } else {
                console.error('AppConfirm modal not found.');
                form.submit();
            }
            return;
        }
    });
});
