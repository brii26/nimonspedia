<div class="my-reviews-container">
    <div class="page-header">
        <h1>My Reviews</h1>
        <p class="text-muted">Manage all your product reviews</p>
    </div>

    <?php if (empty($reviews)): ?>
        <!-- Empty State -->
        <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
                <path d="M12 14l-3 3m0 0l3 3m-3-3h9"></path>
            </svg>
            <h3>No Reviews Yet</h3>
            <p>You haven't written any reviews. Start reviewing products from your completed orders!</p>
            <a href="/orders" class="btn btn-primary">View Orders</a>
        </div>
    <?php else: ?>
        <!-- Reviews List -->
        <div class="reviews-list" id="reviews-list">
            <?php foreach ($reviews as $review): ?>
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
            <?php endforeach; ?>
        </div>

        <!-- Pagination -->
        <?php if ($pagination['total_pages'] > 1): ?>
            <div class="pagination-container">
                <div class="pagination">
                    <?php if ($pagination['current_page'] > 1): ?>
                        <a href="?page=<?= $pagination['current_page'] - 1 ?>" class="page-link">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                            Previous
                        </a>
                    <?php endif; ?>

                    <div class="page-numbers">
                        <?php 
                        $start = max(1, $pagination['current_page'] - 2);
                        $end = min($pagination['total_pages'], $pagination['current_page'] + 2);
                        
                        if ($start > 1): ?>
                            <a href="?page=1" class="page-number">1</a>
                            <?php if ($start > 2): ?>
                                <span class="page-ellipsis">...</span>
                            <?php endif; ?>
                        <?php endif; ?>

                        <?php for ($i = $start; $i <= $end; $i++): ?>
                            <a href="?page=<?= $i ?>" 
                               class="page-number <?= $i === $pagination['current_page'] ? 'active' : '' ?>">
                                <?= $i ?>
                            </a>
                        <?php endfor; ?>

                        <?php if ($end < $pagination['total_pages']): ?>
                            <?php if ($end < $pagination['total_pages'] - 1): ?>
                                <span class="page-ellipsis">...</span>
                            <?php endif; ?>
                            <a href="?page=<?= $pagination['total_pages'] ?>" class="page-number">
                                <?= $pagination['total_pages'] ?>
                            </a>
                        <?php endif; ?>
                    </div>

                    <?php if ($pagination['current_page'] < $pagination['total_pages']): ?>
                        <a href="?page=<?= $pagination['current_page'] + 1 ?>" class="page-link">
                            Next
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </a>
                    <?php endif; ?>
                </div>

                <div class="pagination-info">
                    Showing <?= ($pagination['current_page'] - 1) * $pagination['per_page'] + 1 ?> 
                    to <?= min($pagination['current_page'] * $pagination['per_page'], $pagination['total']) ?> 
                    of <?= $pagination['total'] ?> reviews
                </div>
            </div>
        <?php endif; ?>
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
