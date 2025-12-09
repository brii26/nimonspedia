/**
 * Seller Reviews List Handler
 * Handles infinite scroll, filter tabs, and delete response functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    // Configuration from PHP
    const config = window.sellerReviewsConfig || {
        currentPage: 1,
        hasMore: false,
        currentFilter: 'all'
    };

    // State
    let currentPage = config.currentPage;
    let hasMore = config.hasMore;
    let currentFilter = config.currentFilter;
    let isLoading = false;

    // DOM Elements
    const reviewsList = document.getElementById('reviewsList');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const scrollSentinel = document.querySelector('.scroll-sentinel');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const deleteModal = document.getElementById('deleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    
    let responseIdToDelete = null;
    let observer = null;

    // Initialize
    init();

    function init() {
        setupFilterTabs();
        setupInfiniteScroll();
        setupDeleteButtons();
        setupModalHandlers();
    }

    // ============ Filter Tab Handlers ============
    function setupFilterTabs() {
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const newFilter = tab.getAttribute('data-filter');
                
                if (newFilter === currentFilter) return;

                // Update active tab
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Reset state and load new filter
                currentFilter = newFilter;
                currentPage = 1;
                hasMore = false;
                
                // Clear reviews list
                reviewsList.innerHTML = '<div class="loading-spinner" style="display: flex;"><div class="spinner"></div></div>';
                
                // Load reviews with new filter
                loadReviews(currentFilter, currentPage, true);
            });
        });
    }

    // ============ Infinite Scroll Handlers ============
    function setupInfiniteScroll() {
        if (!scrollSentinel || !hasMore) return;

        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && hasMore && !isLoading) {
                    loadMoreReviews();
                }
            });
        }, {
            rootMargin: '100px'
        });

        observer.observe(scrollSentinel);
    }

    function loadMoreReviews() {
        if (isLoading || !hasMore) return;

        isLoading = true;
        currentPage++;

        if (loadingSpinner) {
            loadingSpinner.style.display = 'flex';
        }

        loadReviews(currentFilter, currentPage, false);
    }

    async function loadReviews(filter, page, replace = false) {
        try {
            const url = `/seller/reviews?filter=${filter}&page=${page}`;
            const res = await fetchXhr(url, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const response = await res.json();

            if (response.success) {
                const reviews = response.data || [];
                hasMore = response.has_more || false;

                if (replace) {
                    // Replace all reviews
                    reviewsList.innerHTML = '';
                    
                    if (reviews.length === 0) {
                        showEmptyState(filter);
                    } else {
                        reviews.forEach(review => {
                            reviewsList.insertAdjacentHTML('beforeend', buildReviewCardHTML(review));
                        });
                    }
                } else {
                    // Append reviews
                    const sentinel = reviewsList.querySelector('.scroll-sentinel');
                    const spinner = reviewsList.querySelector('.loading-spinner');
                    
                    reviews.forEach(review => {
                        const cardHTML = buildReviewCardHTML(review);
                        if (sentinel) {
                            sentinel.insertAdjacentHTML('beforebegin', cardHTML);
                        } else if (spinner) {
                            spinner.insertAdjacentHTML('beforebegin', cardHTML);
                        } else {
                            reviewsList.insertAdjacentHTML('beforeend', cardHTML);
                        }
                    });
                }

                // Update sentinel
                updateScrollSentinel();

                // Re-attach delete button handlers
                setupDeleteButtons();

            } else {
                console.error('Failed to load reviews:', response.message);
                if (replace) {
                    showErrorState();
                }
            }

        } catch (error) {
            console.error('Error loading reviews:', error);
            if (replace) {
                showErrorState();
            }
        } finally {
            isLoading = false;
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
        }
    }

    function updateScrollSentinel() {
        // Remove old sentinel and spinner
        const oldSentinel = reviewsList.querySelector('.scroll-sentinel');
        const oldSpinner = reviewsList.querySelector('.loading-spinner');
        
        if (oldSentinel) {
            if (observer) observer.unobserve(oldSentinel);
            oldSentinel.remove();
        }

        // Add new sentinel if has more
        if (hasMore) {
            const sentinel = document.createElement('div');
            sentinel.className = 'scroll-sentinel';
            
            const spinner = oldSpinner || document.createElement('div');
            if (!oldSpinner) {
                spinner.className = 'loading-spinner';
                spinner.style.display = 'none';
                spinner.innerHTML = '<div class="spinner"></div><p>Loading more reviews...</p>';
            }
            
            reviewsList.appendChild(sentinel);
            reviewsList.appendChild(spinner);

            if (observer) {
                observer.observe(sentinel);
            }
        } else if (oldSpinner) {
            oldSpinner.remove();
        }
    }

    function showEmptyState(filter) {
        let message = "Your products haven't received any reviews yet.";
        
        if (filter === 'unanswered') {
            message = "You've responded to all reviews!";
        } else if (filter === 'answered') {
            message = "No answered reviews yet.";
        }

        reviewsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>No Reviews Found</h3>
                <p>${message}</p>
            </div>
        `;
    }

    function showErrorState() {
        reviewsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Error Loading Reviews</h3>
                <p>Something went wrong. Please try again.</p>
                <button class="btn btn-primary" onclick="window.location.reload()">Reload Page</button>
            </div>
        `;
    }

    function buildReviewCardHTML(review) {
        const hasResponse = review.has_seller_response > 0;
        const statusBadge = hasResponse 
            ? '<span class="status-badge status-answered">Answered</span>'
            : '<span class="status-badge status-unanswered">Unanswered</span>';

        // Build rating stars
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            starsHTML += `<span class="star ${i <= review.rating ? 'filled' : ''}">★</span>`;
        }

        // Build review images
        let imagesHTML = '';
        if (review.images && review.images.length > 0) {
            imagesHTML = '<div class="review-images">';
            review.images.forEach(image => {
                imagesHTML += `<img src="${escapeHtml(image.image_url)}" alt="Review image" class="review-image-thumb">`;
            });
            imagesHTML += '</div>';
        }

        // Build response section
        let responseHTML = '';
        if (hasResponse && review.response) {
            const responseDate = new Date(review.response.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
            
            responseHTML = `
                <div class="seller-response">
                    <div class="response-header">
                        <strong>Your Response</strong>
                        <span class="response-date">${responseDate}</span>
                    </div>
                    <div class="response-text">${review.response.response_text}</div>
                    <div class="response-actions">
                        <a href="/seller/reviews/edit-response?response_id=${review.response.response_id}" 
                           class="btn btn-sm btn-secondary">
                            Edit Response
                        </a>
                        <button type="button" 
                                class="btn btn-sm btn-danger btn-delete-response" 
                                data-response-id="${review.response.response_id}">
                            Delete Response
                        </button>
                    </div>
                </div>
            `;
        } else {
            responseHTML = `
                <div class="no-response">
                    <a href="/seller/reviews/respond?review_id=${review.review_id}" 
                       class="btn btn-primary">
                        Respond to Review
                    </a>
                </div>
            `;
        }

        const reviewDate = new Date(review.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        const imagePath = review.main_image_path || 'product_images/default-product.svg';

        return `
            <div class="review-item" data-review-id="${review.review_id}">
                <div class="review-header">
                    <div class="product-info">
                        <img src="/storage/${escapeHtml(imagePath)}" 
                             alt="Product" 
                             class="product-thumbnail">
                        <div class="product-details">
                            <h3 class="product-name">${escapeHtml(review.product_name)}</h3>
                            <div class="review-meta">
                                <span class="reviewer-name">${escapeHtml(review.username)}</span>
                                <span class="separator">•</span>
                                <span class="review-date">${reviewDate}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="review-actions">
                        ${statusBadge}
                    </div>
                </div>

                <div class="review-content">
                    <div class="rating-stars">
                        ${starsHTML}
                    </div>
                    
                    ${review.comment ? `<div class="review-comment">${review.comment}</div>` : ''}
                    ${imagesHTML}
                </div>

                ${responseHTML}
            </div>
        `;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============ Delete Response Handlers ============
    function setupDeleteButtons() {
        const deleteButtons = document.querySelectorAll('.btn-delete-response');
        
        deleteButtons.forEach(btn => {
            // Remove old listeners by cloning
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                responseIdToDelete = newBtn.getAttribute('data-response-id');
                openModal();
            });
        });
    }

    function setupModalHandlers() {
        // Cancel delete
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => {
                closeModal();
                responseIdToDelete = null;
            });
        }

        // Close modal on outside click
        if (deleteModal) {
            deleteModal.addEventListener('click', (e) => {
                if (e.target === deleteModal) {
                    closeModal();
                    responseIdToDelete = null;
                }
            });
        }

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && deleteModal && deleteModal.classList.contains('active')) {
                closeModal();
                responseIdToDelete = null;
            }
        });

        // Confirm delete
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', async () => {
                if (!responseIdToDelete) return;

                // Disable button during request
                confirmDeleteBtn.disabled = true;
                confirmDeleteBtn.textContent = 'Deleting...';

                try {
                    // Get CSRF token
                    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                                     getCsrfTokenFromCookie();

                    // Create form data
                    const formData = new FormData();
                    formData.append('response_id', responseIdToDelete);
                    formData.append('csrf_token', csrfToken);

                    // Send delete request
                    const res = await fetchXhr('/seller/reviews/delete-response', {
                        method: 'POST',
                        body: formData
                    });

                    const response = await res.json();

                    if (response.success) {
                        // Show success notification
                        showNotification('Response deleted successfully', 'success');
                        
                        // Remove the response section from DOM
                        removeResponseFromDOM(responseIdToDelete);
                        
                        // Close modal
                        closeModal();
                        responseIdToDelete = null;

                    } else {
                        showNotification(response.message || 'Failed to delete response', 'error');
                        confirmDeleteBtn.disabled = false;
                        confirmDeleteBtn.textContent = 'Delete';
                    }

                } catch (error) {
                    console.error('Error deleting response:', error);
                    showNotification('An error occurred. Please try again.', 'error');
                    confirmDeleteBtn.disabled = false;
                    confirmDeleteBtn.textContent = 'Delete';
                }
            });
        }
    }

    function openModal() {
        if (deleteModal) {
            deleteModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal() {
        if (deleteModal) {
            deleteModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Reset button state
        if (confirmDeleteBtn) {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = 'Delete';
        }
    }

    function removeResponseFromDOM(responseId) {
        // Find the review item containing this response
        const deleteBtn = document.querySelector(`[data-response-id="${responseId}"]`);
        if (!deleteBtn) return;

        const reviewItem = deleteBtn.closest('.review-item');
        if (!reviewItem) return;

        // Find the seller response section
        const responseSection = reviewItem.querySelector('.seller-response');
        if (responseSection) {
            // Replace with "Respond to Review" button
            const reviewId = reviewItem.getAttribute('data-review-id');
            const noResponseDiv = document.createElement('div');
            noResponseDiv.className = 'no-response';
            noResponseDiv.innerHTML = `
                <a href="/seller/reviews/respond?review_id=${reviewId}" 
                   class="btn btn-primary">
                    Respond to Review
                </a>
            `;
            
            responseSection.parentNode.replaceChild(noResponseDiv, responseSection);
            
            // Update status badge
            const statusBadge = reviewItem.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.className = 'status-badge status-unanswered';
                statusBadge.textContent = 'Unanswered';
            }
        }
    }

    function showNotification(message, type) {
        // Try to use notification system if available
        if (typeof Notification !== 'undefined' && Notification.show) {
            if (type === 'success') {
                Notification.success(message);
            } else {
                Notification.error(message);
            }
            return;
        }

        // Fallback: Create simple notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    function getCsrfTokenFromCookie() {
        // Try to get CSRF token from cookie
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrf_token') {
                return decodeURIComponent(value);
            }
        }
        return '';
    }
});
