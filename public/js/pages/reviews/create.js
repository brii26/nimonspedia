/**
 * Review Create Form Handler
 * Handles review submission with image uploads
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('review-form');
    const commentInput = document.getElementById('comment');
    const charCount = document.getElementById('char-count');
    const imagesInput = document.getElementById('images-input');
    const uploadArea = document.getElementById('upload-area');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const submitBtn = document.getElementById('submit-btn');

    // Initialize star rating
    const starRating = new StarRating('#star-rating', {
        maxRating: 5,
        initialRating: 0,
        onChange: (rating) => {
            console.log('Rating changed:', rating);
        }
    });

    // Track selected files
    let selectedFiles = [];
    const MAX_FILES = 3;
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    // Character counter
    if (commentInput && charCount) {
        commentInput.addEventListener('input', () => {
            const count = commentInput.value.length;
            charCount.textContent = count;
            
            if (count > 500) {
                charCount.style.color = '#dc2626';
            } else {
                charCount.style.color = '#6b7280';
            }
        });
    }

    // File input handling
    if (imagesInput) {
        imagesInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }

    // Drag and drop
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });
    }

    function handleFiles(files) {
        const errorEl = document.getElementById('images-error');
        errorEl.textContent = '';

        // Convert FileList to Array
        const filesArray = Array.from(files);

        // Check total count
        if (selectedFiles.length + filesArray.length > MAX_FILES) {
            errorEl.textContent = `Maximum ${MAX_FILES} images allowed`;
            return;
        }

        // Validate each file
        for (const file of filesArray) {
            // Check type
            if (!ALLOWED_TYPES.includes(file.type)) {
                errorEl.textContent = 'Only JPEG, PNG, and WebP images are allowed';
                return;
            }

            // Check size
            if (file.size > MAX_FILE_SIZE) {
                errorEl.textContent = `File ${file.name} exceeds 2MB limit`;
                return;
            }
        }

        // Add files
        selectedFiles.push(...filesArray);
        updateImagePreviews();
    }

    function updateImagePreviews() {
        if (!imagePreviewContainer) return;

        imagePreviewContainer.innerHTML = '';

        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'image-preview-item';
                previewDiv.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button type="button" class="image-preview-remove" data-index="${index}">
                        ×
                    </button>
                `;
                imagePreviewContainer.appendChild(previewDiv);

                // Add remove handler
                const removeBtn = previewDiv.querySelector('.image-preview-remove');
                removeBtn.addEventListener('click', () => removeImage(index));
            };
            reader.readAsDataURL(file);
        });

        // Show/hide upload area based on file count
        if (uploadArea) {
            if (selectedFiles.length >= MAX_FILES) {
                uploadArea.style.display = 'none';
            } else {
                uploadArea.style.display = 'block';
            }
        }
    }

    function removeImage(index) {
        selectedFiles.splice(index, 1);
        updateImagePreviews();
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Clear previous errors
            clearErrors();

            // Validate
            if (!validateForm()) {
                return;
            }

            // Disable submit button
            setSubmitting(true);

            try {
                // Create FormData
                const formData = new FormData();
                formData.append('csrf_token', form.querySelector('[name="csrf_token"]').value);
                formData.append('order_id', form.querySelector('[name="order_id"]').value);
                formData.append('product_id', form.querySelector('[name="product_id"]').value);
                formData.append('rating', starRating.getRating());
                formData.append('comment', commentInput.value.trim());

                // Add images
                selectedFiles.forEach((file, index) => {
                    formData.append('images[]', file);
                });

                // Submit
                const response = await fetch('/reviews/submit', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    // Show success message
                    Notification.success('Review submitted successfully!');
                    
                    // Redirect after delay
                    setTimeout(() => {
                        const orderId = form.querySelector('[name="order_id"]').value;
                        window.location.href = '/orders/show?id=' + orderId;
                    }, 1500);
                } else {
                    // Show error
                    Notification.error(result.message || 'Failed to submit review');
                    setSubmitting(false);
                }

            } catch (error) {
                console.error('Error submitting review:', error);
                Notification.error('An error occurred. Please try again.');
                setSubmitting(false);
            }
        });
    }

    function validateForm() {
        let isValid = true;

        // Validate rating
        const rating = starRating.getRating();
        if (rating === 0) {
            document.getElementById('rating-error').textContent = 'Please select a rating';
            isValid = false;
        }

        // Validate comment length (optional field, but if filled check length)
        if (commentInput.value.length > 500) {
            document.getElementById('comment-error').textContent = 'Comment exceeds maximum length';
            isValid = false;
        }

        return isValid;
    }

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
    }

    function setSubmitting(isSubmitting) {
        if (!submitBtn) return;

        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        if (isSubmitting) {
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-block';
        } else {
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

});
