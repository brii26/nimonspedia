document.addEventListener('DOMContentLoaded', () => {
    
    // Toggle Filter
    const toggleButton = document.getElementById('toggle-advanced-filter');
    const advancedFilters = document.getElementById('advanced-filters-container');

    if (toggleButton && advancedFilters) {
        toggleButton.addEventListener('click', () => {
            advancedFilters.classList.toggle('open');
            if (advancedFilters.classList.contains('open')) {
                toggleButton.textContent = 'Close Filter';
            } else {
                toggleButton.textContent = 'Advanced Filter';
            }
        });
    }

    // AJAX Search & Filter Logic
    const filterForm = document.querySelector('.filter-form');
    if (!filterForm) return;

    const productListContainer = document.getElementById('product-list-container');
    const searchInput = document.getElementById('filter-search');
    const categorySelect = document.getElementById('filter-category');
    const priceSelect = document.getElementById('filter-price');
    const perPageSelect = document.getElementById('filter-perPage');
    const resetLink = filterForm.querySelector('.btn-secondary');
    const submitButton = filterForm.querySelector('.btn-search');

    // State untuk Metadata (Auth & Flags) - akan diupdate dari response API pertama kali
    let appMeta = {
        is_logged_in: false,
        checkout_enabled: false,
        csrf_token: ''
    };

    // Fetch Session Metadata separately (Non-cached)
    const fetchSessionMeta = () => {
        fetchXhr('/api/session-meta', { method: 'GET' })
            .then(response => response.json())
            .then(data => {
                appMeta = data;
                // Re-render products if they are already loaded to update Auth buttons
                if (productListContainer.children.length > 0 && !productListContainer.querySelector('.products-empty-state')) {
                    // Trigger refetch or just let the next fetch handle it.
                    // For now, let's just let the next interaction update it, or we could store products state.
                    // Ideally, we fetch meta BEFORE products.
                }
            })
            .catch(console.error);
    };

    // Initial Fetch Sequence
    fetchSessionMeta();

    const fetchProducts = (urlOverride = null) => {
        if (!productListContainer) return;

        productListContainer.style.opacity = '0.5';
        if (submitButton) App.showLoading(submitButton, 'Loading...');
        
        let fetchUrl;
        let pushStateUrl;

        // Construct API URL (/products) and Browser URL
        if (urlOverride) {
            const urlObj = new URL(urlOverride, window.location.origin);
            const searchParams = urlObj.search;
            
            fetchUrl = `/products${searchParams}`;
            pushStateUrl = `${window.location.pathname}${searchParams}`;
        } else {
            const formData = new FormData(filterForm);
            const params = new URLSearchParams(formData);
            
            // Reset ke page 1 jika filter berubah (bukan paginasi)
            params.set('page', '1');
            
            const queryString = params.toString();
            fetchUrl = `/products?${queryString}`;
            pushStateUrl = `${window.location.pathname}?${queryString}`;
        }

        fetchXhr(fetchUrl, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            // Note: Data meta is now fetched separately
            
            if (data.data && Array.isArray(data.data)) {
                renderProductList(data.data);
                renderPagination(data);
                
                // Update URL browser tanpa reload
                history.pushState(null, '', pushStateUrl);
            } else {
                renderEmptyState();
            }
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            productListContainer.innerHTML = '<div class="alert-box error"><p>Error loading products. Please try again.</p></div>';
        })
        .finally(() => {
            productListContainer.style.opacity = '1';
            if (submitButton) App.hideLoading(submitButton);
        });
    };

    const renderEmptyState = () => {
        productListContainer.innerHTML = `
            <div class="products-empty-state">
                <h3>No products found.</h3>
                <p>Try adjusting your search or filter.</p>
            </div>
        `;
    };

    const renderProductList = (products) => {
        if (products.length === 0) {
            renderEmptyState();
            return;
        }

        // Wrapper Grid
        let html = '<div class="products-grid">';

        html += products.map(product => {
            // Image Preview Logic (Simplified equivalent to PHP)
            let imageSrc = '/storage/' + (product.main_image_path || 'product_images/default-product.svg');
            // Note: JS doesn't easily check file existence for preview, so we rely on main image or onerror fallback if implemented in img tag
            
                const formatRupiah = (price) => {
                    const amount = parseInt(price) || 0; // Pastikan jadi integer agar tidak ada koma di belakang
                    return 'Rp ' + amount.toLocaleString('id-ID'); // Gunakan toLocaleString untuk format ribuan dan prefix 'Rp '
                };
            const addToCartBtn = (appMeta.is_logged_in && appMeta.checkout_enabled) ? `
                <button type="submit" class="btn ${product.stock > 0 ? 'btn-primary' : ''}"  
                    style="width: 100%;" ${product.stock <= 0 ? 'disabled' : ''}>
                    ${product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
            ` : '';

            return `
            <div class="product-card">
                <a href="/product?id=${product.product_id}" class="product-image-link">
                    <img src="${imageSrc}" 
                         alt="${escapeHtml(product.product_name)}" 
                         class="product-image"
                         loading="lazy"
                         onerror="this.onerror=null;this.src='/storage/${product.main_image_path || 'product_images/default-product.svg'}';">
                </a>
                <div class="product-info">
                    <a href="/product?id=${product.product_id}" class="product-name-link">
                        <h3 class="product-name">${escapeHtml(product.product_name)}</h3>
                    </a>
                    
                    <a href="/store?id=${product.store_id}" class="product-store-link">
                        ${escapeHtml(product.store_name)}
                    </a>

                    <p class="product-price">${formatRupiah(product.price)}</p>
                    
                    <form class="add-to-cart-listing" data-product-id="${product.product_id}">
                        <input type="hidden" name="product_id" value="${product.product_id}">
                        <input type="hidden" name="csrf_token" value="${appMeta.csrf_token}">
                        <input type="hidden" name="quantity" value="1">
                        ${addToCartBtn}
                    </form>
                </div>
            </div>
            `;
        }).join('');

        html += '</div>'; // End products-grid
        productListContainer.innerHTML = html;
    };

    const renderPagination = (meta) => {
        if (meta.total_pages <= 1) return;

        const currentPage = parseInt(meta.current_page);
        const totalPages = parseInt(meta.total_pages);
        const w = 2;
        let lastNum = 0;

        const pageUrl = (page) => {
            const params = new URLSearchParams(new FormData(filterForm));
            params.set('page', page);
            return `?${params.toString()}`;
        };

        let html = '<nav style="margin-top: 2rem;"><div class="pagination" style="justify-content: center;">';

        if (currentPage > 1) {
            html += `<a href="${pageUrl(currentPage - 1)}" class="pagination-item pagination-prev">&#8592;</a>`;
        } else {
            html += `<span class="pagination-item pagination-prev disabled">&#8592;</span>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            const show = (i === 1 || i === totalPages || (i >= currentPage - w && i <= currentPage + w));
            if (show) {
                if (i > lastNum + 1) html += '<span class="pagination-item disabled" style="border:none;background:none;">…</span>';
                html += `<a href="${pageUrl(i)}" class="pagination-item ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</a>`;
                lastNum = i;
            }
        }

        if (currentPage < totalPages) {
            html += `<a href="${pageUrl(currentPage + 1)}" class="pagination-item pagination-next">&#8594;</a>`;
        } else {
            html += `<span class="pagination-item pagination-next disabled">&#8594;</span>`;
        }

        html += '</div></nav>';
        productListContainer.insertAdjacentHTML('beforeend', html);
    };

    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Event Listeners
    if (searchInput && typeof App.debounce === 'function') {
        searchInput.addEventListener('input', App.debounce(() => fetchProducts(), 400));
    } else if (searchInput) {
        searchInput.addEventListener('input', () => fetchProducts());
    }

    [categorySelect, priceSelect, perPageSelect].forEach(el => {
        if (el) el.addEventListener('change', () => fetchProducts());
    });

    // Pagination Click Handler (Delegation)
    productListContainer.addEventListener('click', e => {
        if (e.target.matches('.pagination-item')) {
            e.preventDefault(); // Selalu prevent default biar ga reload

            // Hanya fetch jika tidak disabled dan tidak active
            if (!e.target.classList.contains('disabled') && !e.target.classList.contains('active')) {
                const url = e.target.getAttribute('href');
                // Ambil query string-nya saja untuk dikirim ke fetchProducts
                // fetchProducts akan handle parsingnya
                fetchProducts(url);
            }
        }
    });

    filterForm.addEventListener('submit', e => {
        e.preventDefault();
        fetchProducts();
    });

    if (resetLink) {
        resetLink.addEventListener('click', e => {
            e.preventDefault();
            filterForm.reset();
            const baseUrl = window.location.pathname; // Reset ke root tanpa query params
            fetchProducts(baseUrl);
        });
    }
});
