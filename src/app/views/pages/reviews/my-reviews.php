<?php
$hasMore = $pagination['has_more'] ?? false;
$currentPage = $pagination['current_page'] ?? 1;
?>
<div class="my-reviews-container">
    <div class="page-header">
        <h1>My Reviews</h1>
        <p class="text-muted">Manage all your product reviews</p>
    </div>

    <!-- Reviews List -->
    <div class="reviews-list" id="reviews-list">
        <?php if (empty($reviews)): ?>
            <div class="empty-state">
                <h3>No Reviews Yet</h3>
                <p>You haven't written any reviews. Start reviewing products from your completed orders!</p>
                <a href="/orders" class="btn btn-primary">View Orders</a>
            </div>
        <?php else: ?>
            <?php foreach ($reviews as $review): ?>
                <?= View::component('my-review-card', ['review' => $review]); ?>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>

    <!-- Sentinel for infinite scroll -->
    <?php if (!empty($reviews) && $hasMore): ?>
        <div id="scroll-sentinel" class="scroll-sentinel">
            <div class="loading-spinner"></div>
        </div>
    <?php endif; ?>
</div>

<!-- Image Modal -->
<div id="image-modal" class="modal" onclick="closeImageModal()">
    <span class="modal-close">&times;</span>
    <img class="modal-content" id="modal-image">
</div>

<!-- Delete Confirmation Modal -->
<div id="delete-modal" class="modal">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Delete Review</h3>
                <button type="button" class="modal-close" onclick="closeDeleteModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this review? This action cannot be undone.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeDeleteModal()">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirm-delete-btn">Delete</button>
            </div>
        </div>
    </div>
</div>

<script>
    window.reviewsConfig = {
        currentPage: <?= (int)$currentPage ?>,
        hasMore: <?= $hasMore ? 'true' : 'false' ?>
    };
</script>