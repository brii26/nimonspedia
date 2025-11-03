document.addEventListener('DOMContentLoaded', () => {
    
    // Toggle Filter
    const toggleButton = document.getElementById('toggle-advanced-filter');
    const advancedFilters = document.getElementById('advanced-filters-container');

    if (toggleButton && advancedFilters) {
        
        toggleButton.addEventListener('click', () => {
            advancedFilters.classList.toggle('open');
            
            if (advancedFilters.classList.contains('open')) {
                toggleButton.textContent = 'Tutup Opsi Filter';
            } else {
                toggleButton.textContent = 'Opsi Filter Lanjutan';
            }
        });
    }

    // AJAX Search
    const filterForm = document.querySelector('.filter-form');
    if (!filterForm) return;

    const productListContainer = document.getElementById('product-list-container');
    const searchInput = document.getElementById('filter-search');
    const categorySelect = document.getElementById('filter-category');
    const priceSelect = document.getElementById('filter-price');
    const perPageSelect = document.getElementById('filter-perPage');
    const resetLink = filterForm.querySelector('.btn-secondary');
    const submitButton = filterForm.querySelector('.btn-search');

    const fetchProducts = (urlOverride = null) => {
        if (!productListContainer) return;

        productListContainer.style.opacity = '0.5';

        if (submitButton) App.showLoading(submitButton, 'Loading...');
        
        let fetchUrl;

        if (urlOverride) {
            fetchUrl = urlOverride;
        } else {
            const formData = new FormData(filterForm);
            const params = new URLSearchParams(formData);
            const actionUrl = filterForm.getAttribute('action') || window.location.pathname;
            const queryString = params.toString();
            fetchUrl = `${actionUrl}?${queryString}`;
        }

        fetchXhr(fetchUrl, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.html) {
                productListContainer.innerHTML = data.html;
                history.pushState(null, '', fetchUrl);
            }
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            productListContainer.innerHTML = '<p>Error loading products. Please try again.</p>';
        })
        .finally(() => {
            productListContainer.style.opacity = '1';
            if (submitButton) App.hideLoading(submitButton);
        });
    };

    if (searchInput && typeof App.debounce === 'function') {
        searchInput.addEventListener('input', App.debounce(() => fetchProducts(), 400));
    } else if (searchInput) {
        searchInput.addEventListener('input', () => fetchProducts());
    }

    if (categorySelect) categorySelect.addEventListener('change', () => fetchProducts());
    if (priceSelect) priceSelect.addEventListener('change', () => fetchProducts());
    if (perPageSelect) perPageSelect.addEventListener('change', () => fetchProducts());

    if (productListContainer) {
        productListContainer.addEventListener('click', e => {
            if (e.target.matches('.pagination-item')) {
                e.preventDefault(); 
                const url = e.target.getAttribute('href');
                history.pushState(null, '', url);
                
                const queryString = url.split('?')[1] || '';
                const params = new URLSearchParams(queryString);
                params.forEach((value, key) => {
                    const input = filterForm.querySelector(`[name="${key}"]`);
                    if (input) {
                        input.value = value;
                    }
                });
                
                // Ini sudah benar karena 'url' adalah string
                fetchProducts(url); 
            }
        });
    }

    filterForm.addEventListener('submit', e => {
        e.preventDefault(); 
        e.stopImmediatePropagation();
        
        fetchProducts(); 
    });

    if (resetLink) {
        resetLink.addEventListener('click', e => {
            e.preventDefault();
            
            filterForm.reset(); 

            const baseUrl = resetLink.getAttribute('href') || window.location.pathname;
            history.pushState(null, '', baseUrl);
            
            fetchProducts(baseUrl);
        });
    }
});