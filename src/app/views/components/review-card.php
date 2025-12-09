<!-- Review Card Component -->
<?php
/**
 * Component untuk menampilkan single review
 * Expected data:
 * - $review: array with review details including user, rating, comment, images, response
 */

$userName = View::escape($review['username'] ?? 'Anonymous');
$rating = (int)($review['rating'] ?? 0);
$comment = $review['comment'] ?? '';
$createdAt = $review['created_at'] ?? '';
$images = $review['images'] ?? [];
$response = $review['response'] ?? null;
$isEdited = isset($review['updated_at']) && $review['updated_at'] !== $review['created_at'];
?>

<div class="review-card-item" data-review-id="<?= View::escape($review['review_id'] ?? '') ?>">
    <div class="review-header">
        <div class="reviewer-info">
            <div class="reviewer-avatar">
                <?= strtoupper(substr($userName, 0, 1)) ?>
            </div>
            <div class="reviewer-details">
                <div class="reviewer-name"><?= $userName ?></div>
                <div class="review-meta">
                    <div class="review-rating-stars">
                        <?php for ($i = 1; $i <= 5; $i++): ?>
                            <span class="star <?= $i <= $rating ? 'active' : '' ?>">★</span>
                        <?php endfor; ?>
                    </div>
                    <span class="meta-divider">•</span>
                    <span class="review-date"><?= View::date($createdAt) ?></span>
                    <?php if ($isEdited): ?>
                        <span class="meta-divider">•</span>
                        <span class="edited-badge">Edited</span>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <?php if (!empty($comment)): ?>
        <div class="review-content">
            <?= SanitizerService::sanitizeRichText($comment) ?>
        </div>
    <?php endif; ?>

    <?php if (!empty($images)): ?>
        <div class="review-images-grid">
            <?php foreach ($images as $index => $image): 
                // Generate preview path: append _preview before extension
                $imageUrl = $image['image_url'];
                $pathInfo = pathinfo($imageUrl);
                $previewUrl = $pathInfo['dirname'] . '/' . $pathInfo['filename'] . '_preview.' . ($pathInfo['extension'] ?? 'jpg');
            ?>
                <div class="review-image-item" onclick="openReviewImageModal('<?= View::escape($imageUrl) ?>')">
                    <img src="/storage/<?= View::escape($previewUrl) ?>" 
                         alt="Review image <?= $index + 1 ?>"
                         loading="lazy"
                         onerror="this.src='/storage/<?= View::escape($imageUrl) ?>'">
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <?php if ($response): ?>
        <div class="review-response">
            <div class="response-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <strong><?= $response['responder_role'] === 'ADMIN' ? 'Admin' : 'Seller' ?> Response</strong>
                <span class="response-date"><?= View::date($response['created_at']) ?></span>
            </div>
            <div class="response-content">
                <?= SanitizerService::sanitizeRichText($response['response_text']) ?>
            </div>
        </div>
    <?php endif; ?>
</div>
