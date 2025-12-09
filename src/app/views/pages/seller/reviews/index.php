<?php
/**
 * Seller Reviews Management - List View
 * Shows all reviews for seller's products with filter options
 */

$reviews = $reviewsData['data'] ?? [];
$pagination = $reviewsData;
$currentFilter = $filter ?? 'all';
?>

<div class="seller-reviews-container">
    <div class="page-header">
        <h1>Manage Reviews</h1>
        <p class="subtitle">Review and respond to customer feedback</p>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
        <a href="/seller/reviews?filter=all" class="filter-tab <?= $currentFilter === 'all' ? 'active' : '' ?>">
            All Reviews
        </a>
        <a href="/seller/reviews?filter=unanswered" class="filter-tab <?= $currentFilter === 'unanswered' ? 'active' : '' ?>">
            Unanswered
        </a>
        <a href="/seller/reviews?filter=answered" class="filter-tab <?= $currentFilter === 'answered' ? 'active' : '' ?>">
            Answered
        </a>
    </div>

    <!-- Reviews List -->
    <div class="reviews-list">
        <?php if (empty($reviews)): ?>
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>No Reviews Found</h3>
                <p>
                    <?php if ($currentFilter === 'unanswered'): ?>
                        You've responded to all reviews!
                    <?php elseif ($currentFilter === 'answered'): ?>
                        No answered reviews yet.
                    <?php else: ?>
                        Your products haven't received any reviews yet.
                    <?php endif; ?>
                </p>
            </div>
        <?php else: ?>
            <?php foreach ($reviews as $review): ?>
                <div class="review-item" data-review-id="<?= $review['review_id'] ?>">
                    <div class="review-header">
                        <div class="product-info">
                            <img src="<?= View::escape($review['product_image'] ?? '/assets/images/placeholder.png') ?>" 
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
            <?php endforeach; ?>

            <!-- Pagination -->
            <?php if ($pagination['total_pages'] > 1): ?>
                <div class="pagination">
                    <?php if ($pagination['current_page'] > 1): ?>
                        <a href="/seller/reviews?filter=<?= $currentFilter ?>&page=<?= $pagination['current_page'] - 1 ?>" 
                           class="pagination-btn">
                            ← Previous
                        </a>
                    <?php endif; ?>

                    <span class="pagination-info">
                        Page <?= $pagination['current_page'] ?> of <?= $pagination['total_pages'] ?>
                    </span>

                    <?php if ($pagination['has_more']): ?>
                        <a href="/seller/reviews?filter=<?= $currentFilter ?>&page=<?= $pagination['current_page'] + 1 ?>" 
                           class="pagination-btn">
                            Next →
                        </a>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        <?php endif; ?>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<div id="deleteModal" class="modal">
    <div class="modal-content">
        <h3>Delete Response</h3>
        <p>Are you sure you want to delete this response? This action cannot be undone.</p>
        <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="cancelDelete">Cancel</button>
            <button type="button" class="btn btn-danger" id="confirmDelete">Delete</button>
        </div>
    </div>
</div>
