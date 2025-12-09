<?php
/**
 * Seller Review Card Component
 * Displays a single review item for seller
 */
$initial = strtoupper(substr($review['username'] ?? 'U', 0, 1));
?>

<div class="review-item" data-review-id="<?= $review['review_id'] ?>">
    <div class="review-item-header">
        <div class="customer-info">
            <div class="customer-avatar"><?= $initial ?></div>
            <div class="customer-details">
                <h4 class="customer-name"><?= View::escape($review['username']) ?></h4>
                <div class="review-meta">
                    <div class="rating-stars">
                        <?php for ($i = 1; $i <= 5; $i++): ?>
                            <span class="star <?= $i <= $review['rating'] ? 'active' : '' ?>">★</span>
                        <?php endfor; ?>
                    </div>
                    <span class="meta-separator">•</span>
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

    <div class="review-item-body">
        <!-- Product Link -->
        <a href="/product?id=<?= $review['product_id'] ?>" class="product-link">
            <img src="/storage/<?= View::escape($review['main_image_path'] ?? 'product_images/default-product.svg') ?>" 
                 alt="<?= View::escape($review['product_name']) ?>">
            <span><?= View::escape($review['product_name']) ?></span>
        </a>
        
        <?php if (!empty($review['comment'])): ?>
            <div class="review-comment"><?= SanitizerService::sanitizeRichText($review['comment']) ?></div>
        <?php endif; ?>

        <?php if (!empty($review['images'])): ?>
            <div class="review-images">
                <?php foreach ($review['images'] as $image): ?>
                    <img src="/storage/<?= View::escape($image['image_url']) ?>" 
                         alt="Review image">
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>

    <!-- Seller Response Section -->
    <?php if (!empty($review['response'])): ?>
        <div class="seller-response">
            <div class="response-header">
                <span class="response-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                    </svg>
                    Your Response
                </span>
                <span class="response-date"><?= date('M d, Y', strtotime($review['response']['created_at'])) ?></span>
            </div>
            <div class="response-text"><?= SanitizerService::sanitizeRichText($review['response']['response_text']) ?></div>
            <div class="response-actions">
                <a href="/seller/reviews/edit-response?response_id=<?= $review['response']['response_id'] ?>" 
                   class="btn btn-sm btn-secondary">
                    Edit
                </a>
                <button type="button" 
                        class="btn btn-sm btn-danger btn-delete-response" 
                        data-response-id="<?= $review['response']['response_id'] ?>">
                    Delete
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
