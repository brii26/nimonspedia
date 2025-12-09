<?php
/**
 * Seller Reviews - Edit Response Form
 * Form to edit an existing seller response
 */

$responseId = $response['response_id'] ?? 0;
$responseText = $response['response_text'] ?? '';
$reviewId = $review['review_id'] ?? 0;
$rating = $review['rating'] ?? 0;
$comment = $review['comment'] ?? '';
$productName = $review['product_name'] ?? 'Unknown Product';
$reviewerName = $review['username'] ?? 'Anonymous';
$reviewDate = $review['created_at'] ?? '';
?>

<div class="response-form-container">
    <div class="page-header">
        <a href="/seller/reviews" class="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Reviews
        </a>
        <h1>Edit Response</h1>
    </div>

    <!-- Review Preview -->
    <div class="review-preview">
        <div class="review-preview-header">
            <div class="reviewer-info">
                <div class="customer-avatar">
                    <?= strtoupper(substr($reviewerName, 0, 1)) ?>
                </div>
                <div class="reviewer-details">
                    <span class="reviewer-name"><?= View::escape($reviewerName) ?></span>
                    <span class="review-date"><?= date('F d, Y', strtotime($reviewDate)) ?></span>
                </div>
            </div>
            <div class="rating-stars">
                <?php for ($i = 1; $i <= 5; $i++): ?>
                    <span class="star <?= $i <= $rating ? 'active' : '' ?>">★</span>
                <?php endfor; ?>
            </div>
        </div>

        <div class="product-info-inline">
            <strong>Product:</strong> <?= View::escape($productName) ?>
        </div>

        <?php if (!empty($comment)): ?>
            <div class="review-preview-comment">
                <?= SanitizerService::sanitizeRichText($comment) ?>
            </div>
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

    <!-- Edit Response Form Section -->
    <div class="response-form-section">
        <h2>Edit Your Response</h2>
        <p class="form-subtitle">Update your response to the customer's feedback</p>

        <form id="editResponseForm" method="POST" action="/seller/reviews/update-response">
            <input type="hidden" name="response_id" value="<?= $responseId ?>">
            <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?? '' ?>">

            <div class="form-group">
                <label for="response-editor">Response <span class="required">*</span></label>
                <div id="response-editor" style="height: 180px;"><?= $responseText ?></div>
                <input type="hidden" name="response_text" id="response-text-input" value="<?= View::escape($responseText) ?>" required>
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
                    Update Response
                </button>
            </div>
        </form>
    </div>
</div>

<!-- Notification Container -->
<div id="notificationContainer"></div>
