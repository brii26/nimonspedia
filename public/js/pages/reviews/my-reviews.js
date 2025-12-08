/**
 * My Reviews Page Handler
 * Handles review deletion and image modal
 */

document.addEventListener('DOMContentLoaded', () => {
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const imageModal = document.getElementById('image-modal');
    
    let reviewToDelete = null;

    // Handle delete button clicks
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
                    // Remove review card from DOM
                    const reviewCard = document.querySelector(`[data-review-id="${reviewToDelete}"]`);
                    if (reviewCard) {
                        reviewCard.style.opacity = '0';
                        reviewCard.style.transform = 'translateX(-20px)';
                        setTimeout(() => {
                            reviewCard.remove();
                            
                            // Check if list is empty
                            const reviewsList = document.getElementById('reviews-list');
                            if (reviewsList && reviewsList.children.length === 0) {
                                location.reload(); // Reload to show empty state
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

    // Make closeDeleteModal global for onclick
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
            closeImageModal();
        }
    });

    // Helper to get CSRF token
    function getCSRFToken() {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
            return metaTag.getAttribute('content');
        }
        
        // Fallback: try to find it in a form
        const csrfInput = document.querySelector('input[name="csrf_token"]');
        if (csrfInput) {
            return csrfInput.value;
        }
        
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
});
