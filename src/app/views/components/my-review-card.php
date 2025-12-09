<?php
/**
 * My Review Card Component
 * Used for infinite scroll rendering in my-reviews page (buyer's own reviews)
 */
?>
<div class="review-card" data-review-id="<?= View::escape($review['review_id']) ?>">
    <!-- Product Info -->
    <div class="review-card-header">
        <div class="product-info">
            <img src="/storage/<?= View::escape($review['product_image'] ?? 'product_images/default-product.svg') ?>" 
                 alt="<?= View::escape($review['product_name']) ?>"
                 class="product-thumb">
            <div class="product-details">
                <h3><?= View::escape($review['product_name']) ?></h3>
                <p class="store-name"><?= View::escape($review['store_name']) ?></p>
                <p class="review-date"><?= View::date($review['created_at']) ?></p>
            </div>
        </div>
        <div class="review-actions">
            <a href="/reviews/edit?review_id=<?= View::escape($review['review_id']) ?>" 
               class="btn-icon" 
               title="Edit Review">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </a>
            <button type="button" 
                    class="btn-icon btn-delete" 
                    data-review-id="<?= View::escape($review['review_id']) ?>"
                    title="Delete Review">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    </div>

    <!-- Rating -->
    <div class="review-rating">
        <div class="stars">
            <?php for ($i = 1; $i <= 5; $i++): ?>
                <span class="star <?= $i <= $review['rating'] ? 'active' : '' ?>">★</span>
            <?php endfor; ?>
        </div>
        <span class="rating-value"><?= View::escape($review['rating']) ?>/5</span>
    </div>

    <!-- Comment -->
    <?php if (!empty($review['comment'])): ?>
        <div class="review-comment">
            <?= SanitizerService::sanitizeRichText($review['comment']) ?>
        </div>
    <?php endif; ?>

    <!-- Images -->
    <?php if (!empty($review['images'])): ?>
        <div class="review-images">
            <?php foreach ($review['images'] as $image): ?>
                <div class="review-image">
                    <img src="/storage/<?= View::escape($image['image_path']) ?>" 
                         alt="Review photo"
                         onclick="openImageModal(this.src)">
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <!-- Status Badges -->
    <div class="review-status">
        <?php if ($review['is_hidden']): ?>
            <span class="badge badge-warning">Hidden by Admin</span>
        <?php endif; ?>
        <?php if ($review['updated_at'] !== $review['created_at']): ?>
            <span class="badge badge-info">Edited</span>
        <?php endif; ?>
    </div>
</div>
