document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('seller-product-list-container');
    if (!container) return;

    const back = container.querySelector('.go-back') || document.querySelector('.go-back');
    if (back) back.addEventListener('click', () => (window.location.href = '/'));

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
        container.style.opacity = '0.5';
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
                    container.innerHTML = html;
                    history.pushState(null, '', url);
                }
            })
            .finally(() => {
                container.style.opacity = '1';
            });
    };

    // Build URL
    const urlFromForm = (page = 1) => {
        const form = container.querySelector('#product-filter-form');
        const params = new URLSearchParams(new FormData(form));
        params.set('page', String(page));
        return `${form.action}?${params.toString()}`;
    };

    // Pagination
    container.addEventListener('click', (e) => {
        const a = e.target.closest('#products-pagination a');
        if (!a) return;
        e.preventDefault();
        fetchAndSwap(a.getAttribute('href'));
    });

    // Filter & sort
    const debouncedReload = App.debounce
        ? App.debounce(() => fetchAndSwap(urlFromForm(1)), 350)
        : () => fetchAndSwap(urlFromForm(1));

    container.addEventListener('input', (e) => {
        if (e.target && e.target.id === 'search-input') debouncedReload();
    });

    container.addEventListener('change', (e) => {
        const id = e.target && e.target.id;
        if (id === 'filter-category' || id === 'sort-select' || id === 'filter-perPage') {
            fetchAndSwap(urlFromForm(1));
        }
    });
});
