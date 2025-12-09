<?php
/**
 * Seller Reviews - Respond Form
 * Form to submit a response to a customer review
 */

$reviewId = $review['review_id'] ?? 0;
$rating = $review['rating'] ?? 0;
$comment = $review['comment'] ?? '';
$productName = $review['product_name'] ?? 'Unknown Product';
$reviewerName = $review['username'] ?? 'Anonymous';
$reviewDate = $review['created_at'] ?? '';
?>

<div class="seller-response-form-container">
    <div class="page-header">
        <a href="/seller/reviews" class="back-link">← Back to Reviews</a>
        <h1>Respond to Review</h1>
    </div>

    <div class="response-form-layout">
        <!-- Review Display -->
        <div class="review-display">
            <h2>Customer Review</h2>
            
            <div class="review-card">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">
                            <?= strtoupper(substr($reviewerName, 0, 1)) ?>
                        </div>
                        <div>
                            <div class="reviewer-name"><?= View::escape($reviewerName) ?></div>
                            <div class="review-date"><?= date('F d, Y', strtotime($reviewDate)) ?></div>
                        </div>
                    </div>
                </div>

                <div class="product-info">
                    <strong>Product:</strong> <?= View::escape($productName) ?>
                </div>

                <div class="rating-display">
                    <?php for ($i = 1; $i <= 5; $i++): ?>
                        <span class="star <?= $i <= $rating ? 'filled' : '' ?>">★</span>
                    <?php endfor; ?>
                    <span class="rating-text"><?= $rating ?>/5</span>
                </div>

                <?php if (!empty($comment)): ?>
                    <div class="review-comment">
                        <?= SanitizerService::sanitizeRichText($comment) ?>
                    </div>
                <?php endif; ?>

                <?php if (!empty($review['images'])): ?>
                    <div class="review-images">
                        <?php foreach ($review['images'] as $image): ?>
                            <img src="<?= View::escape($image['image_url']) ?>" 
                                 alt="Review image" 
                                 class="review-image">
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Response Form -->
        <div class="response-form">
            <h2>Your Response</h2>
            <p class="form-subtitle">Write a professional response to address the customer's feedback</p>

            <form id="responseForm" method="POST" action="/seller/reviews/respond">
                <input type="hidden" name="review_id" value="<?= $reviewId ?>">
                <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?? '' ?>">

                <div class="form-group">
                    <label for="response-editor">Response <span class="required">*</span></label>
                    <div id="response-editor" style="height: 180px;"></div>
                    <input type="hidden" name="response_text" id="response-text-input" required>
                    <div class="char-counter">
                        <span id="charCount">0</span>/500 characters
                    </div>
                </div>

                <div class="response-tips">
                    <h4>💡 Tips for a great response:</h4>
                    <ul>
                        <li>Thank the customer for their feedback</li>
                        <li>Address specific points they mentioned</li>
                        <li>Be professional and courteous</li>
                        <li>Offer solutions if there were issues</li>
                        <li>Keep it concise and genuine</li>
                    </ul>
                </div>

                <div class="form-actions">
                    <a href="/seller/reviews" class="btn btn-secondary">Cancel</a>
                    <button type="submit" class="btn btn-primary" id="submitBtn">
                        Submit Response
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Notification Container -->
<div id="notificationContainer"></div>
