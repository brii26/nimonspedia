/**
 * Order Detail Page - Delete Review Handler
 */
document.addEventListener('DOMContentLoaded', function() {
    const deleteModal = document.getElementById('delete-review-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-review-btn');
    
    // Only run if modal exists (received orders only)
    if (!deleteModal || !confirmDeleteBtn) return;
    
    let reviewToDelete = null;

    function openDeleteReviewModal(reviewId) {
        reviewToDelete = reviewId;
        deleteModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    window.closeDeleteReviewModal = function() {
        deleteModal.style.display = 'none';
        document.body.style.overflow = '';
        reviewToDelete = null;
    };

    // Close modal on backdrop click
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            closeDeleteReviewModal();
        }
    });

    // Delete button click handlers
    document.querySelectorAll('.delete-review-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const reviewId = this.dataset.reviewId;
            openDeleteReviewModal(reviewId);
        });
    });

    // Get CSRF token from meta tag
    function getCSRFToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }

    // Confirm delete handler
    confirmDeleteBtn.addEventListener('click', async function() {
        if (!reviewToDelete) return;

        try {
            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.textContent = 'Deleting...';

            const formData = new FormData();
            formData.append('csrf_token', getCSRFToken());
            formData.append('review_id', reviewToDelete);

            const response = await fetch('/reviews/delete', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                closeDeleteReviewModal();
                window.Notification && Notification.success('Review deleted successfully!');
                setTimeout(() => location.reload(), 1000);
            } else {
                window.Notification && Notification.error(result.message || 'Failed to delete review');
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            window.Notification && Notification.error('An error occurred');
        } finally {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = 'Delete';
        }
    });
});
