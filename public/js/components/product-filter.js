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

        // Gunakan fetchXhr (karena Anda punya)
        fetchXhr(fetchUrl, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest' // Ini penting!
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.html) {
                // Ganti isi container dengan HTML baru
                productListContainer.innerHTML = data.html;
                
                // Update URL di browser tanpa reload
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
        searchInput.addEventListener('input', App.debounce(fetchProducts, 400));
    } else if (searchInput) {
        searchInput.addEventListener('input', fetchProducts);
    }

    // 2. FILTER LAINNYA (Langsung)
    if (categorySelect) categorySelect.addEventListener('change', fetchProducts);
    if (priceSelect) priceSelect.addEventListener('change', fetchProducts);
    if (perPageSelect) perPageSelect.addEventListener('change', fetchProducts);

    // 3. PAGINASI (Via event delegation)
    // Kita harus pasang di container karena link <a> akan di-reload
    if (productListContainer) {
        productListContainer.addEventListener('click', e => {
            // Cek apakah yang diklik adalah link pagination
            if (e.target.matches('.pagination-item')) {
                e.preventDefault(); // Hentikan navigasi standar
                const url = e.target.getAttribute('href');
                
                // Update URL di browser
                history.pushState(null, '', url);
                
                // Ambil query string dari URL pagination
                const queryString = url.split('?')[1] || '';
                
                // Update form agar nilainya pas (terutama 'page')
                const params = new URLSearchParams(queryString);
                params.forEach((value, key) => {
                    const input = filterForm.querySelector(`[name="${key}"]`);
                    if (input) {
                        input.value = value;
                    }
                });

                // Fetch produk untuk halaman baru
                fetchProducts(url);
            }
        });
    }

    // 4. HENTIKAN SUBMIT & RESET BAWAAN
    filterForm.addEventListener('submit', e => {
        e.preventDefault(); // Hentikan reload halaman

        e.stopImmediatePropagation();
        
        fetchProducts(url); // Jalankan fetch manual
    });

    if (resetLink) {
        resetLink.addEventListener('click', e => {
            e.preventDefault();
            
            filterForm.reset(); 

            const baseUrl = resetLink.getAttribute('href') || window.location.pathname;
            history.pushState(null, '', baseUrl);
            
            fetchProducts(url);
        });
    }
});