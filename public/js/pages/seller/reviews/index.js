/**
 * Seller Reviews List Handler
 * Handles delete response functionality and modal interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    const deleteModal = document.getElementById('deleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const deleteButtons = document.querySelectorAll('.btn-delete-response');
    
    let responseIdToDelete = null;

    // Open delete modal
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            responseIdToDelete = btn.getAttribute('data-response-id');
            openModal();
        });
    });

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
                const response = await fetchXhr('/seller/reviews/delete-response', {
                    method: 'POST',
                    body: formData
                });

                if (response.success) {
                    // Show success notification
                    showNotification('Response deleted successfully', 'success');
                    
                    // Remove the response section from DOM
                    removeResponseFromDOM(responseIdToDelete);
                    
                    // Close modal
                    closeModal();
                    
                    // Optionally reload page after delay to update counts
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
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

// Add CSS animation keyframes if not already present
if (!document.querySelector('#notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
