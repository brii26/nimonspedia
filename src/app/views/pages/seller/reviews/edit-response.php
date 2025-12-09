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

<div class="seller-response-form-container">
    <div class="page-header">
        <a href="/seller/reviews" class="back-link">← Back to Reviews</a>
        <h1>Edit Response</h1>
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
                        <p><?= nl2br(View::escape($comment)) ?></p>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Edit Response Form -->
        <div class="response-form">
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
                        <span id="charCount"><?= strlen($responseText) ?></span>/500 characters
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
</div>

<!-- Notification Container -->
<div id="notificationContainer"></div>
