/**
 * Product Reviews List Handler
 * Handles review filtering, sorting, and pagination on product detail page
 */

class ProductReviews {
    constructor(productId) {
        this.productId = productId;
        this.currentPage = 1;
        this.perPage = 3;
        this.filterRating = null;
        this.sortBy = 'newest'; // newest, oldest, highest, lowest
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadReviews();
    }

    bindEvents() {
        // Rating filter buttons
        document.querySelectorAll('[data-filter-rating]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.currentTarget;
                const rating = button.getAttribute('data-filter-rating');
                this.setRatingFilter(rating === 'all' ? null : parseInt(rating));
            });
        });

        // Sort dropdown
        const sortSelect = document.getElementById('review-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.setSortBy(e.target.value);
            });
        }

        // Pagination clicks (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-page]')) {
                e.preventDefault();
                const page = parseInt(e.target.closest('[data-page]').getAttribute('data-page'));
                this.loadPage(page);
            }
        });
    }

    setRatingFilter(rating) {
        this.filterRating = rating;
        this.currentPage = 1;
        this.updateFilterButtons();
        this.loadReviews();
    }

    setSortBy(sortBy) {
        this.sortBy = sortBy;
        this.currentPage = 1;
        this.loadReviews();
    }

    updateFilterButtons() {
        document.querySelectorAll('[data-filter-rating]').forEach(btn => {
            const btnRating = btn.getAttribute('data-filter-rating');
            if (btnRating === 'all' && this.filterRating === null) {
                btn.classList.add('active');
            } else if (parseInt(btnRating) === this.filterRating) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    loadPage(page) {
        this.currentPage = page;
        this.loadReviews();
    }

    async loadReviews() {
        const container = document.getElementById('reviews-list-container');
        const loadingEl = document.getElementById('reviews-loading');
        
        if (!container) return;

        try {
            // Show loading
            if (loadingEl) loadingEl.style.display = 'flex';
            
            // Build query params
            const params = new URLSearchParams({
                product_id: this.productId,
                page: this.currentPage,
                per_page: this.perPage,
                sort_by: this.sortBy
            });

            if (this.filterRating !== null) {
                params.append('rating', this.filterRating);
            }

            // Fetch reviews
            const response = await fetch(`/reviews/product?${params.toString()}`);
            const result = await response.json();

            if (result.success) {
                this.renderReviews(result.data);
                this.renderPagination(result.pagination);
            } else {
                this.showError('Failed to load reviews');
            }

        } catch (error) {
            console.error('Error loading reviews:', error);
            this.showError('An error occurred while loading reviews');
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    renderReviews(reviews) {
        const container = document.getElementById('reviews-list-container');
        if (!container) return;

        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="no-reviews-filtered">
                    <p>No reviews found matching your filter</p>
                </div>
            `;
            return;
        }

        container.innerHTML = reviews.map(review => this.renderReviewCard(review)).join('');
    }

    renderReviewCard(review) {
        const userName = this.escapeHtml(review.username || 'Anonymous');
        const rating = parseInt(review.rating || 0);
        const comment = review.comment || '';
        const images = review.images || [];
        const response = review.response || null;
        const isEdited = review.updated_at && review.updated_at !== review.created_at;

        const starsHtml = Array.from({length: 5}, (_, i) => 
            `<span class="star ${i < rating ? 'active' : ''}">★</span>`
        ).join('');

        const imagesHtml = images.length > 0 ? `
            <div class="review-images-grid">
                ${images.map((img, idx) => {
                    const imageUrl = img.image_url;
                    const previewUrl = this.getPreviewPath(imageUrl);
                    return `
                    <div class="review-image-item" onclick="openReviewImageModal('${this.escapeHtml(imageUrl)}')">
                        <img src="/storage/${this.escapeHtml(previewUrl)}" 
                             alt="Review image ${idx + 1}"
                             loading="lazy"
                             onerror="this.src='/storage/${this.escapeHtml(imageUrl)}'">
                    </div>
                `}).join('')}
            </div>
        ` : '';

        const responseHtml = response ? `
            <div class="review-response">
                <div class="response-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    <strong>${response.responder_role === 'ADMIN' ? 'Admin' : 'Seller'} Response</strong>
                    <span class="response-date">${this.formatDate(response.created_at)}</span>
                </div>
                <div class="response-content">
                    <p>${this.escapeHtml(response.response_text).replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        ` : '';

        return `
            <div class="review-card-item" data-review-id="${review.review_id}">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">
                            ${userName.charAt(0).toUpperCase()}
                        </div>
                        <div class="reviewer-details">
                            <div class="reviewer-name">${userName}</div>
                            <div class="review-meta">
                                <div class="review-rating-stars">${starsHtml}</div>
                                <span class="meta-divider">•</span>
                                <span class="review-date">${this.formatDate(review.created_at)}</span>
                                ${isEdited ? '<span class="meta-divider">•</span><span class="edited-badge">Edited</span>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
                ${comment ? `<div class="review-content">${comment}</div>` : ''}
                ${imagesHtml}
                ${responseHtml}
            </div>
        `;
    }

    renderPagination(pagination) {
        const container = document.getElementById('reviews-pagination');
        if (!container || pagination.total_pages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        const { current_page, total_pages } = pagination;
        
        let paginationHtml = '<div class="pagination">';

        // Previous button
        if (current_page > 1) {
            paginationHtml += `
                <a href="#" class="page-link" data-page="${current_page - 1}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Previous
                </a>
            `;
        }

        // Page numbers
        paginationHtml += '<div class="page-numbers">';
        
        const start = Math.max(1, current_page - 2);
        const end = Math.min(total_pages, current_page + 2);

        if (start > 1) {
            paginationHtml += `<a href="#" class="page-number" data-page="1">1</a>`;
            if (start > 2) {
                paginationHtml += '<span class="page-ellipsis">...</span>';
            }
        }

        for (let i = start; i <= end; i++) {
            paginationHtml += `
                <a href="#" class="page-number ${i === current_page ? 'active' : ''}" data-page="${i}">
                    ${i}
                </a>
            `;
        }

        if (end < total_pages) {
            if (end < total_pages - 1) {
                paginationHtml += '<span class="page-ellipsis">...</span>';
            }
            paginationHtml += `<a href="#" class="page-number" data-page="${total_pages}">${total_pages}</a>`;
        }

        paginationHtml += '</div>';

        // Next button
        if (current_page < total_pages) {
            paginationHtml += `
                <a href="#" class="page-link" data-page="${current_page + 1}">
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </a>
            `;
        }

        paginationHtml += '</div>';

        container.innerHTML = paginationHtml;
    }

    showError(message) {
        const container = document.getElementById('reviews-list-container');
        if (container) {
            container.innerHTML = `
                <div class="reviews-error">
                    <p>${this.escapeHtml(message)}</p>
                </div>
            `;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Generate preview path from original image path
     * Appends _preview before the extension
     */
    getPreviewPath(imagePath) {
        if (!imagePath) return '';
        const lastDot = imagePath.lastIndexOf('.');
        if (lastDot === -1) return imagePath + '_preview';
        return imagePath.substring(0, lastDot) + '_preview' + imagePath.substring(lastDot);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
}

// Image modal function
window.openReviewImageModal = function(imagePath) {
    let modal = document.getElementById('review-image-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'review-image-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <span class="modal-close" onclick="closeReviewImageModal()">&times;</span>
            <img class="modal-content" id="review-modal-image">
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeReviewImageModal();
            }
        });
    }
    
    const modalImg = document.getElementById('review-modal-image');
    modal.style.display = 'flex';
    modalImg.src = '/storage/' + imagePath;
    document.body.style.overflow = 'hidden';
};

window.closeReviewImageModal = function() {
    const modal = document.getElementById('review-image-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const productIdEl = document.getElementById('product-id');
    if (productIdEl) {
        const productId = productIdEl.value;
        window.productReviews = new ProductReviews(productId);
    }
});
