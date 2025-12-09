<?php
/**
 * Seller Review Card Component
 * Displays a single review item for seller
 */
?>

<div class="review-item" data-review-id="<?= $review['review_id'] ?>">
    <div class="review-header">
        <div class="product-info">
            <img src="/storage/<?= View::escape($review['main_image_path'] ?? 'product_images/default-product.svg') ?>" 
                 alt="Product" 
                 class="product-thumbnail">
            <div class="product-details">
                <h3 class="product-name"><?= View::escape($review['product_name']) ?></h3>
                <div class="review-meta">
                    <span class="reviewer-name"><?= View::escape($review['username']) ?></span>
                    <span class="separator">•</span>
                    <span class="review-date"><?= date('M d, Y', strtotime($review['created_at'])) ?></span>
                </div>
            </div>
        </div>
        
        <div class="review-actions">
            <?php if ($review['has_seller_response'] > 0): ?>
                <span class="status-badge status-answered">Answered</span>
            <?php else: ?>
                <span class="status-badge status-unanswered">Unanswered</span>
            <?php endif; ?>
        </div>
    </div>

    <div class="review-content">
        <div class="rating-stars">
            <?php for ($i = 1; $i <= 5; $i++): ?>
                <span class="star <?= $i <= $review['rating'] ? 'filled' : '' ?>">★</span>
            <?php endfor; ?>
        </div>
        
        <?php if (!empty($review['comment'])): ?>
            <div class="review-comment"><?= SanitizerService::sanitizeRichText($review['comment']) ?></div>
        <?php endif; ?>

        <?php if (!empty($review['images'])): ?>
            <div class="review-images">
                <?php foreach ($review['images'] as $image): ?>
                    <img src="<?= View::escape($image['image_url']) ?>" 
                         alt="Review image" 
                         class="review-image-thumb">
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>

    <!-- Seller Response Section -->
    <?php if (!empty($review['response'])): ?>
        <div class="seller-response">
            <div class="response-header">
                <strong>Your Response</strong>
                <span class="response-date"><?= date('M d, Y', strtotime($review['response']['created_at'])) ?></span>
            </div>
            <div class="response-text"><?= SanitizerService::sanitizeRichText($review['response']['response_text']) ?></div>
            <div class="response-actions">
                <a href="/seller/reviews/edit-response?response_id=<?= $review['response']['response_id'] ?>" 
                   class="btn btn-sm btn-secondary">
                    Edit Response
                </a>
                <button type="button" 
                        class="btn btn-sm btn-danger btn-delete-response" 
                        data-response-id="<?= $review['response']['response_id'] ?>">
                    Delete Response
                </button>
            </div>
        </div>
    <?php else: ?>
        <div class="no-response">
            <a href="/seller/reviews/respond?review_id=<?= $review['review_id'] ?>" 
               class="btn btn-primary">
                Respond to Review
            </a>
        </div>
    <?php endif; ?>
</div>
