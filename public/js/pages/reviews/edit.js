/**
 * Review Edit Form Handler
 * Handles review update with image management (delete existing, add new)
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('review-form');
    const commentInput = document.getElementById('comment');
    const charCount = document.getElementById('char-count');
    const imagesInput = document.getElementById('images-input');
    const uploadArea = document.getElementById('upload-area');
    const uploadContainer = document.getElementById('upload-container');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const existingImagesContainer = document.getElementById('existing-images-container');
    const uploadLimitText = document.getElementById('upload-limit-text');
    const submitBtn = document.getElementById('submit-btn');

    // Get initial rating from data attribute
    const starRatingElement = document.getElementById('star-rating');
    const initialRating = parseInt(starRatingElement.getAttribute('data-initial-rating')) || 0;

    // Initialize star rating with existing value
    const starRating = new StarRating('#star-rating', {
        maxRating: 5,
        initialRating: initialRating,
        onChange: (rating) => {
            console.log('Rating changed:', rating);
        }
    });

    // Track images
    let existingImages = [];
    let imagesToDelete = [];
    let newFiles = [];
    const MAX_FILES = 3;
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    // Initialize existing images
    if (existingImagesContainer) {
        const existingImageElements = existingImagesContainer.querySelectorAll('.image-preview-item');
        existingImageElements.forEach(el => {
            const imageId = parseInt(el.getAttribute('data-image-id'));
            existingImages.push(imageId);
        });
        updateUploadAvailability();
    }

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

    // Handle existing image removal
    if (existingImagesContainer) {
        existingImagesContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('image-preview-remove')) {
                const imageId = parseInt(e.target.getAttribute('data-image-id'));
                handleExistingImageRemove(imageId, e.target.closest('.image-preview-item'));
            }
        });
    }

    function handleExistingImageRemove(imageId, element) {
        // Add to delete list
        imagesToDelete.push(imageId);
        
        // Remove from existing list
        const index = existingImages.indexOf(imageId);
        if (index > -1) {
            existingImages.splice(index, 1);
        }

        // Visual removal
        element.style.opacity = '0.5';
        element.style.pointerEvents = 'none';
        
        // Mark as deleted visually
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            inset: 0;
            background: rgba(220, 38, 38, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 0.875rem;
            border-radius: 8px;
        `;
        overlay.textContent = 'Will be deleted';
        element.style.position = 'relative';
        element.appendChild(overlay);

        updateUploadAvailability();
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

        // Calculate total images (existing - deleted + new)
        const totalImages = existingImages.length + newFiles.length + filesArray.length;

        // Check total count
        if (totalImages > MAX_FILES) {
            errorEl.textContent = `Maximum ${MAX_FILES} images allowed (you have ${existingImages.length} existing)`;
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
        newFiles.push(...filesArray);
        updateImagePreviews();
        updateUploadAvailability();
    }

    function updateImagePreviews() {
        if (!imagePreviewContainer) return;

        imagePreviewContainer.innerHTML = '';

        newFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'image-preview-item';
                previewDiv.innerHTML = `
                    <img src="${e.target.result}" alt="New preview ${index + 1}">
                    <button type="button" class="image-preview-remove" data-index="${index}">
                        ×
                    </button>
                `;
                imagePreviewContainer.appendChild(previewDiv);

                // Add remove handler
                const removeBtn = previewDiv.querySelector('.image-preview-remove');
                removeBtn.addEventListener('click', () => removeNewImage(index));
            };
            reader.readAsDataURL(file);
        });
    }

    function removeNewImage(index) {
        newFiles.splice(index, 1);
        updateImagePreviews();
        updateUploadAvailability();
    }

    function updateUploadAvailability() {
        const totalImages = existingImages.length + newFiles.length;
        const remaining = MAX_FILES - totalImages;

        // Update limit text
        if (uploadLimitText) {
            if (remaining > 0) {
                uploadLimitText.textContent = `(Optional, max ${remaining} more image${remaining > 1 ? 's' : ''})`;
            } else {
                uploadLimitText.textContent = '(Maximum images reached)';
            }
        }

        // Show/hide upload area
        if (uploadContainer && uploadArea && imagesInput) {
            if (remaining <= 0) {
                uploadContainer.style.display = 'none';
                imagesInput.disabled = true;
            } else {
                uploadContainer.style.display = 'block';
                imagesInput.disabled = false;
            }
        }
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
                const reviewId = form.querySelector('[name="review_id"]').value;

                // Step 1: Delete images if any
                if (imagesToDelete.length > 0) {
                    await deleteImages(reviewId, imagesToDelete);
                }

                // Step 2: Update review (rating and comment)
                const updateSuccess = await updateReview();
                if (!updateSuccess) {
                    setSubmitting(false);
                    return;
                }

                // Step 3: Add new images if any
                if (newFiles.length > 0) {
                    await addNewImages(reviewId);
                }

                // Show success message
                Notification.success('Review updated successfully!');
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = '/reviews/my-reviews';
                }, 1500);

            } catch (error) {
                console.error('Error updating review:', error);
                Notification.error('An error occurred. Please try again.');
                setSubmitting(false);
            }
        });
    }

    async function deleteImages(reviewId, imageIds) {
        for (const imageId of imageIds) {
            try {
                const formData = new FormData();
                formData.append('csrf_token', form.querySelector('[name="csrf_token"]').value);
                formData.append('review_image_id', imageId);

                const response = await fetch('/reviews/images/delete', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                if (!result.success) {
                    console.warn(`Failed to delete image ${imageId}:`, result.message);
                }
            } catch (error) {
                console.error(`Error deleting image ${imageId}:`, error);
            }
        }
    }

    async function updateReview() {
        const formData = new FormData();
        formData.append('csrf_token', form.querySelector('[name="csrf_token"]').value);
        formData.append('review_id', form.querySelector('[name="review_id"]').value);
        formData.append('rating', starRating.getRating());
        formData.append('comment', commentInput.value.trim());

        const response = await fetch('/reviews/update', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result.success) {
            Notification.error(result.message || 'Failed to update review');
            return false;
        }

        return true;
    }

    async function addNewImages(reviewId) {
        const formData = new FormData();
        formData.append('csrf_token', form.querySelector('[name="csrf_token"]').value);
        formData.append('review_id', reviewId);

        newFiles.forEach((file) => {
            formData.append('images[]', file);
        });

        const response = await fetch('/reviews/images/add', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result.success) {
            console.warn('Failed to add new images:', result.message);
            Notification.error('Review updated but some images failed to upload');
        }
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
