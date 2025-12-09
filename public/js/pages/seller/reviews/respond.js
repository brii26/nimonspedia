/**
 * Seller Review Response Form Handler
 * Handles seller response submission using Quill editor
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('responseForm');
    const charCount = document.getElementById('charCount');
    const submitBtn = document.getElementById('submitBtn');
    const notificationContainer = document.querySelector('.notification-container');

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
                formData.append('review_id', form.querySelector('[name="review_id"]').value);
                formData.append('response_text', responseHtml);

                // Submit
                const response = await fetchXhr('/seller/reviews/respond', {
                    method: 'POST',
                    body: formData
                });

                if (response.success) {
                    // Show success message
                    showNotification('Response submitted successfully!', 'success');
                    
                    // Redirect after delay
                    setTimeout(() => {
                        window.location.href = '/seller/reviews';
                    }, 1500);
                } else {
                    // Show error
                    showNotification(response.message || 'Failed to submit response', 'error');
                    setSubmitting(false);
                }

            } catch (error) {
                console.error('Error submitting response:', error);
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
            submitBtn.textContent = 'Submitting...';
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Response';
        }
    }

    function showNotification(message, type) {
        // Create notification element if container exists
        if (!notificationContainer) {
            alert(message);
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notificationContainer.innerHTML = '';
        notificationContainer.appendChild(notification);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
});
