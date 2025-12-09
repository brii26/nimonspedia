/**
 * My Reviews Page Handler
 * Infinite scroll, delete and image modal
 */

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.my-reviews-container');
    const reviewsList = document.getElementById('reviews-list');
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const imageModal = document.getElementById('image-modal');

    if (!container || !reviewsList) return;

    // State from server-rendered config
    const config = window.reviewsConfig || {};
    let currentPage = config.currentPage || 1;
    let hasMore = config.hasMore || false;
    let isLoading = false;
    let reviewToDelete = null;

    // Get or create sentinel element
    function getSentinel() {
        let sentinel = document.getElementById('scroll-sentinel');
        if (!sentinel && hasMore) {
            sentinel = document.createElement('div');
            sentinel.id = 'scroll-sentinel';
            sentinel.className = 'scroll-sentinel';
            sentinel.innerHTML = '<div class="loading-spinner"></div>';
            reviewsList.parentElement.appendChild(sentinel);
        }
        return sentinel;
    }

    // Remove sentinel
    function removeSentinel() {
        const sentinel = document.getElementById('scroll-sentinel');
        if (sentinel) sentinel.remove();
    }

    // Render stars HTML
    function renderStars(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += `<span class="star ${i <= rating ? 'active' : ''}">★</span>`;
        }
        return html;
    }

    // Render a single review card from data
    function renderReviewCard(review) {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.dataset.reviewId = review.review_id;

        const imagesHtml = review.images && review.images.length > 0 
            ? `<div class="review-images">
                ${review.images.map(img => `
                    <div class="review-image">
                        <img src="/storage/${escapeHtml(img.image_url)}" 
                             alt="Review photo"
                             onclick="openImageModal(this.src)">
                    </div>
                `).join('')}
               </div>`
            : '';

        const statusHtml = [];
        if (review.is_hidden) {
            statusHtml.push('<span class="badge badge-warning">Hidden by Admin</span>');
        }
        if (review.updated_at !== review.created_at) {
            statusHtml.push('<span class="badge badge-info">Edited</span>');
        }

        card.innerHTML = `
            <div class="review-card-header">
                <div class="product-info">
                    <img src="/storage/${escapeHtml(review.main_image_path || 'product_images/default-product.svg')}" 
                         alt="${escapeHtml(review.product_name)}"
                         class="product-thumb">
                    <div class="product-details">
                        <h3>${escapeHtml(review.product_name)}</h3>
                        <p class="store-name">${escapeHtml(review.store_name)}</p>
                        <p class="review-date">${formatDate(review.created_at)}</p>
                    </div>
                </div>
                <div class="review-actions">
                    <a href="/reviews/edit?review_id=${review.review_id}" class="btn-icon" title="Edit Review">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </a>
                    <button type="button" class="btn-icon btn-delete" data-review-id="${review.review_id}" title="Delete Review">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="review-rating">
                <div class="stars">${renderStars(review.rating)}</div>
                <span class="rating-value">${review.rating}/5</span>
            </div>
            ${review.comment ? `<div class="review-comment">${escapeHtml(review.comment)}</div>` : ''}
            ${imagesHtml}
            <div class="review-status">${statusHtml.join('')}</div>
        `;

        return card;
    }

    // Load more reviews via AJAX
    async function loadMore() {
        if (isLoading || !hasMore) return;

        isLoading = true;
        const nextPage = currentPage + 1;

        try {
            const response = await fetch(`/reviews/my-reviews?page=${nextPage}`, {
                method: 'GET',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            const data = await response.json();

            if (data.success && data.data) {
                data.data.forEach(review => {
                    reviewsList.appendChild(renderReviewCard(review));
                });

                currentPage = data.page;
                hasMore = data.has_more;

                if (!hasMore) {
                    removeSentinel();
                }
            }
        } catch (error) {
            console.error('Error loading more reviews:', error);
        } finally {
            isLoading = false;
        }
    }

    // IntersectionObserver for infinite scroll
    let observer = null;
    function setupObserver() {
        if (observer) observer.disconnect();

        const sentinel = getSentinel();
        if (!sentinel) return;

        observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isLoading && hasMore) {
                loadMore();
            }
        }, { rootMargin: '100px' });

        observer.observe(sentinel);
    }

    // Handle delete button clicks (delegated)
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete')) {
            const btn = e.target.closest('.btn-delete');
            reviewToDelete = parseInt(btn.getAttribute('data-review-id'));
            openDeleteModal();
        }
    });

    // Confirm delete
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!reviewToDelete) return;

            try {
                setDeleting(true);

                const formData = new FormData();
                formData.append('csrf_token', getCSRFToken());
                formData.append('review_id', reviewToDelete);

                const response = await fetch('/reviews/delete', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    const reviewCard = document.querySelector(`[data-review-id="${reviewToDelete}"]`);
                    if (reviewCard) {
                        reviewCard.style.opacity = '0';
                        reviewCard.style.transform = 'translateX(-20px)';
                        setTimeout(() => {
                            reviewCard.remove();

                            if (reviewsList && reviewsList.children.length === 0) {
                                reviewsList.innerHTML = `
                                    <div class="empty-state">
                                        <h3>No Reviews Yet</h3>
                                        <p>You haven't written any reviews. Start reviewing products from your completed orders!</p>
                                        <a href="/orders" class="btn btn-primary">View Orders</a>
                                    </div>
                                `;
                            }
                        }, 300);
                    }

                    closeDeleteModal();

                    if (window.showNotification) {
                        window.showNotification('Review deleted successfully', 'success');
                    }
                } else {
                    closeDeleteModal();
                    if (window.showNotification) {
                        window.showNotification(result.message || 'Failed to delete review', 'error');
                    }
                }

            } catch (error) {
                console.error('Error deleting review:', error);
                closeDeleteModal();
                if (window.showNotification) {
                    window.showNotification('An error occurred. Please try again.', 'error');
                }
            } finally {
                setDeleting(false);
                reviewToDelete = null;
            }
        });
    }

    function openDeleteModal() {
        if (deleteModal) {
            deleteModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function closeDeleteModal() {
        if (deleteModal) {
            deleteModal.style.display = 'none';
            document.body.style.overflow = '';
        }
        reviewToDelete = null;
    }

    window.closeDeleteModal = closeDeleteModal;

    function setDeleting(isDeleting) {
        if (!confirmDeleteBtn) return;

        if (isDeleting) {
            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.textContent = 'Deleting...';
        } else {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = 'Delete';
        }
    }

    // Image modal functions
    window.openImageModal = function(src) {
        const modalImg = document.getElementById('modal-image');
        if (imageModal && modalImg) {
            imageModal.style.display = 'flex';
            modalImg.src = src;
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeImageModal = function() {
        if (imageModal) {
            imageModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    };

    // Close modals on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDeleteModal();
            window.closeImageModal();
        }
    });

    // Utility functions
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function getCSRFToken() {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) return metaTag.getAttribute('content');
        const csrfInput = document.querySelector('input[name="csrf_token"]');
        if (csrfInput) return csrfInput.value;
        return '';
    }

    // Add transition styles for smooth removal
    const style = document.createElement('style');
    style.textContent = `
        .review-card {
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    // Initialize observer if has more
    if (hasMore) {
        setupObserver();
    }
});