/**
 * Seller Review Response Edit Form Handler
 * Handles seller response update using Quill editor
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('editResponseForm');
    const charCount = document.getElementById('charCount');
    const submitBtn = document.getElementById('submitBtn');

    // Initialize Quill editor for response
    const quill = createEditor('#response-editor', 'response_text');

    // Character counter for Quill
    if (quill && charCount) {
        quill.on('text-change', () => {
            const text = quill.getText().trim();
            const count = text.length;
            charCount.textContent = count;
            
            if (count > 500) {
                charCount.style.color = '#dc2626';
            } else {
                charCount.style.color = '#6b7280';
            }
        });
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validate
            if (!validateForm()) {
                return;
            }

            // Disable submit button
            setSubmitting(true);

            try {
                // Get Quill content
                const responseHtml = quill ? quill.root.innerHTML : '';
                
                // Create FormData
                const formData = new FormData();
                formData.append('csrf_token', form.querySelector('[name="csrf_token"]').value);
                formData.append('response_id', form.querySelector('[name="response_id"]').value);
                formData.append('response_text', responseHtml);

                // Submit
                const res = await fetchXhr('/seller/reviews/update-response', {
                    method: 'POST',
                    body: formData
                });

                const response = await res.json();

                if (response.success) {
                    // Show success message
                    showNotification('Response updated successfully!', 'success');
                    
                    // Redirect after delay
                    setTimeout(() => {
                        window.location.href = '/seller/reviews';
                    }, 1500);
                } else {
                    // Show error
                    showNotification(response.message || 'Failed to update response', 'error');
                    setSubmitting(false);
                }

            } catch (error) {
                console.error('Error updating response:', error);
                showNotification('An error occurred. Please try again.', 'error');
                setSubmitting(false);
            }
        });
    }

    function validateForm() {
        if (!quill) return false;

        const text = quill.getText().trim();
        
        // Check if empty
        if (text.length === 0) {
            showNotification('Please enter a response', 'error');
            return false;
        }

        // Check length
        if (text.length > 500) {
            showNotification('Response exceeds maximum length of 500 characters', 'error');
            return false;
        }

        return true;
    }

    function setSubmitting(isSubmitting) {
        if (!submitBtn) return;

        if (isSubmitting) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Updating...';
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Update Response';
        }
    }

    function showNotification(message, type) {
        // Use global showNotification from notification.js if available
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }

        // Fallback: create inline notification
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            padding: 1rem 1.5rem;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
        `;
        notification.textContent = message;
        
        container.innerHTML = '';
        container.appendChild(notification);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
});
