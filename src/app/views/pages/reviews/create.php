<div class="review-form-container">
    <div class="card">
        <div class="card-header">
            <h2>Write a Review</h2>
        </div>
        <div class="card-body">
            <!-- Product Info -->
            <div class="product-info-section mb-4">
                <div class="product-preview">
                    <img src="/storage/<?= View::escape($product['main_image_path'] ?? 'product_images/default-product.svg') ?>" 
                         alt="<?= View::escape($product['product_name']) ?>"
                         class="product-thumbnail">
                    <div class="product-details">
                        <h3><?= View::escape($product['product_name']) ?></h3>
                        <p class="text-muted">Order #<?= View::escape($order['order_id']) ?></p>
                    </div>
                </div>
            </div>

            <!-- Review Form -->
            <form id="review-form" enctype="multipart/form-data">
                <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                <input type="hidden" name="order_id" value="<?= View::escape($order['order_id']) ?>">
                <input type="hidden" name="product_id" value="<?= View::escape($product['product_id']) ?>">
                <input type="hidden" name="rating" id="rating-input" value="">

                <!-- Star Rating -->
                <div class="form-group">
                    <label class="form-label required">Rating</label>
                    <div class="star-rating-container">
                        <div class="star-rating" id="star-rating">
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
                    <div id="comment-editor" style="height: 150px;"></div>
                    <input type="hidden" name="comment" id="comment-input">
                    <div class="char-counter">
                        <span id="char-count">0</span> / 500 characters
                    </div>
                    <div class="error-message" id="comment-error"></div>
                </div>

                <!-- Image Upload -->
                <div class="form-group">
                    <label class="form-label">Photos <span class="text-muted">(Optional, max 3 images)</span></label>
                    <div class="image-upload-container">
                        <div class="upload-area" id="upload-area">
                            <input 
                                type="file" 
                                id="images-input" 
                                name="images[]" 
                                multiple 
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                class="file-input">
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
                    <a href="/orders/show?id=<?= View::escape($order['order_id']) ?>" class="btn btn-secondary">
                        Cancel
                    </a>
                    <button type="submit" class="btn btn-primary" id="submit-btn">
                        <span class="btn-text">Submit Review</span>
                        <span class="btn-loading" style="display: none;">
                            <span class="spinner"></span> Submitting...
                        </span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
