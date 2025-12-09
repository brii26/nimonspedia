<!-- Rating Summary Component -->
<?php
/**
 * Component untuk menampilkan rating summary
 * Expected data:
 * - $stats: array with keys: average_rating, total_reviews, rating_distribution
 */

$averageRating = $stats['average_rating'] ?? 0;
$totalReviews = $stats['total_reviews'] ?? 0;
$distribution = $stats['rating_distribution'] ?? [];

// Calculate percentages for distribution bars
$distributionPercentages = [];
for ($i = 5; $i >= 1; $i--) {
    $count = 0;
    foreach ($distribution as $dist) {
        if ($dist['rating'] == $i) {
            $count = $dist['count'];
            break;
        }
    }
    $percentage = $totalReviews > 0 ? ($count / $totalReviews) * 100 : 0;
    $distributionPercentages[$i] = [
        'count' => $count,
        'percentage' => round($percentage, 1)
    ];
}
?>

<div class="rating-summary">
    <?php if ($totalReviews > 0): ?>
        <div class="rating-summary-content">
            <!-- Overall Rating -->
            <div class="overall-rating">
                <div class="rating-number"><?= number_format($averageRating, 1) ?></div>
                <div class="rating-stars">
                    <?php
                    $fullStars = floor($averageRating);
                    $hasHalfStar = ($averageRating - $fullStars) >= 0.5;
                    
                    for ($i = 1; $i <= 5; $i++):
                        if ($i <= $fullStars): ?>
                            <span class="star active">★</span>
                        <?php elseif ($i == $fullStars + 1 && $hasHalfStar): ?>
                            <span class="star half">★</span>
                        <?php else: ?>
                            <span class="star">★</span>
                        <?php endif;
                    endfor;
                    ?>
                </div>
                <div class="rating-count"><?= number_format($totalReviews) ?> review<?= $totalReviews > 1 ? 's' : '' ?></div>
            </div>

            <!-- Rating Distribution -->
            <div class="rating-distribution">
                <?php foreach ($distributionPercentages as $rating => $data): ?>
                    <div class="distribution-row">
                        <div class="distribution-label">
                            <?= $rating ?> <span class="star-small">★</span>
                        </div>
                        <div class="distribution-bar-container">
                            <div class="distribution-bar" 
                                 style="width: <?= $data['percentage'] ?>%"
                                 data-percentage="<?= $data['percentage'] ?>"></div>
                        </div>
                        <div class="distribution-count"><?= number_format($data['count']) ?></div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    <?php else: ?>
        <div class="no-reviews">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <p>No reviews yet</p>
            <p class="text-muted">Be the first to review this product!</p>
        </div>
    <?php endif; ?>
</div>
