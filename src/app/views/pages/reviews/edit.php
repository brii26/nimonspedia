<div class="review-form-container">
    <div class="card">
        <div class="card-header">
            <h2>Edit Review</h2>
        </div>
        <div class="card-body">
            <!-- Product Info -->
            <div class="product-info-section mb-4">
                <div class="product-preview">
                    <img src="/storage/<?= View::escape($review['main_image_path'] ?? 'product_images/default-product.svg') ?>" 
                         alt="<?= View::escape($review['product_name']) ?>"
                         class="product-thumbnail">
                    <div class="product-details">
                        <h3><?= View::escape($review['product_name']) ?></h3>
                        <p class="text-muted">Review ID: #<?= View::escape($review['review_id']) ?></p>
                    </div>
                </div>
            </div>

            <!-- Review Form -->
            <form id="review-form" enctype="multipart/form-data">
                <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                <input type="hidden" name="review_id" value="<?= View::escape($review['review_id']) ?>">
                <input type="hidden" name="rating" id="rating-input" value="<?= View::escape($review['rating']) ?>">

                <!-- Star Rating -->
                <div class="form-group">
                    <label class="form-label required">Rating</label>
                    <div class="star-rating-container">
                        <div class="star-rating" id="star-rating" data-initial-rating="<?= View::escape($review['rating']) ?>">
                            <span class="star" data-value="1">★</span>
                            <span class="star" data-value="2">★</span>
                            <span class="star" data-value="3">★</span>
                            <span class="star" data-value="4">★</span>
                            <span class="star" data-value="5">★</span>
                        </div>
                        <span class="rating-text" id="rating-text"></span>
                    </div>
                    <div class="error-message" id="rating-error"></div>
                </div>

                <!-- Review Comment -->
                <div class="form-group">
                    <label for="comment-editor" class="form-label">Your Review <span class="text-muted">(Optional)</span></label>
                    <div id="comment-editor" style="height: 150px;"><?= $review['comment'] ?? '' ?></div>
                    <input type="hidden" name="comment" id="comment-input" value="<?= View::escape($review['comment'] ?? '') ?>">
                    <div class="char-counter">
                        <span id="char-count"><?= strlen($review['comment'] ?? '') ?></span> / 500 characters
                    </div>
                    <div class="error-message" id="comment-error"></div>
                </div>

                <!-- Existing Images -->
                <?php if (!empty($images)): ?>
                <div class="form-group">
                    <label class="form-label">Current Photos</label>
                    <div class="existing-images-container" id="existing-images-container">
                        <?php foreach ($images as $image): ?>
                        <div class="image-preview-item" data-image-id="<?= View::escape($image['review_image_id']) ?>">
                            <img src="/storage/<?= View::escape($image['image_path']) ?>" 
                                 alt="Review photo">
                            <button type="button" 
                                    class="image-preview-remove" 
                                    data-image-id="<?= View::escape($image['review_image_id']) ?>"
                                    aria-label="Remove image">
                                ×
                            </button>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                <?php endif; ?>

                <!-- Add New Images -->
                <div class="form-group">
                    <label class="form-label">
                        Add More Photos 
                        <span class="text-muted" id="upload-limit-text">
                            (Optional, max <?= 3 - count($images) ?> more images)
                        </span>
                    </label>
                    <div class="image-upload-container" id="upload-container" 
                         <?php if (count($images) >= 3): ?>style="display: none;"<?php endif; ?>>
                        <div class="upload-area" id="upload-area">
                            <input 
                                type="file" 
                                id="images-input" 
                                name="images[]" 
                                multiple 
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                class="file-input"
                                <?php if (count($images) >= 3): ?>disabled<?php endif; ?>>
                            <div class="upload-placeholder">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                                <p>Click to upload or drag and drop</p>
                                <p class="text-muted small">JPEG, PNG, WebP (max 2MB each)</p>
                            </div>
                        </div>
                        <div class="image-preview-container" id="image-preview-container"></div>
                    </div>
                    <div class="error-message" id="images-error"></div>
                </div>

                <!-- Action Buttons -->
                <div class="form-actions">
                    <a href="/reviews/my-reviews" class="btn btn-secondary">
                        Cancel
                    </a>
                    <button type="submit" class="btn btn-primary" id="submit-btn">
                        <span class="btn-text">Update Review</span>
                        <span class="btn-loading" style="display: none;">
                            <span class="spinner"></span> Updating...
                        </span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
