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
        <button class="filter-tab <?= $currentFilter === 'all' ? 'active' : '' ?>" data-filter="all">
            All Reviews
        </button>
        <button class="filter-tab <?= $currentFilter === 'unanswered' ? 'active' : '' ?>" data-filter="unanswered">
            Unanswered
        </button>
        <button class="filter-tab <?= $currentFilter === 'answered' ? 'active' : '' ?>" data-filter="answered">
            Answered
        </button>
    </div>

    <!-- Reviews List -->
    <div class="reviews-list" id="reviewsList">
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
                <?php View::component('seller-review-card', ['review' => $review]); ?>
            <?php endforeach; ?>

            <!-- Infinite Scroll Sentinel -->
            <?php if ($hasMore): ?>
                <div class="scroll-sentinel"></div>
            <?php endif; ?>

            <!-- Loading Spinner -->
            <div class="loading-spinner" style="display: none;">
                <div class="spinner"></div>
                <p>Loading more reviews...</p>
            </div>
        <?php endif; ?>
    </div>
</div>

<!-- Pass data to JavaScript -->
<script>
    window.sellerReviewsConfig = {
        currentPage: <?= $currentPage ?>,
        hasMore: <?= $hasMore ? 'true' : 'false' ?>,
        currentFilter: '<?= View::escape($currentFilter) ?>'
    };
</script>

<!-- Delete Confirmation Modal -->
<div id="deleteModal" class="app-modal" aria-hidden="true">
    <div class="app-modal-backdrop"></div>
    <div class="app-modal-wrapper">
        <div class="app-modal-card" style="max-width: 450px;">
            <div class="app-modal-header">
                <h2>Delete Response</h2>
                <button type="button" class="app-modal-close" id="closeDeleteModal">&times;</button>
            </div>
            <div class="app-modal-body">
                <p>Are you sure you want to delete this response? This action cannot be undone.</p>
            </div>
            <div class="app-modal-footer">
                <button type="button" class="btn btn-secondary" id="cancelDelete">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDelete">Delete</button>
            </div>
        </div>
    </div>
</div>
