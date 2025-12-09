<?php

class ReviewService 
{
    private $reviewRepository;
    private $reviewImageRepository;
    private $reviewResponseRepository;
    private $orderRepository;
    private $productRepository;
    private $fileService;
    
    // Constants
    const MAX_REVIEW_IMAGES = 3;
    const MAX_COMMENT_LENGTH = 500;
    const REVIEW_WINDOW_DAYS = 7;
    const ALLOWED_IMAGE_MIMES = ['jpeg', 'jpg', 'png', 'webp'];
    const MAX_IMAGE_SIZE = 2097152; // 2MB

    public function __construct() 
    {
        $this->reviewRepository = new ReviewRepository();
        $this->reviewImageRepository = new ReviewImageRepository();
        $this->reviewResponseRepository = new ReviewResponseRepository();
        $this->orderRepository = new OrderRepository();
        $this->productRepository = new ProductRepository();
        $this->fileService = new FileService();
    }

    /**
     * Check if user can review a product from an order
     * 
     * @param int $orderId
     * @param int $productId
     * @param int $userId
     * @return array ['can_review' => bool, 'reason' => string|null]
     */
    public function canReview($orderId, $productId, $userId)
    {
        // Get order details
        $order = $this->orderRepository->find($orderId);
        
        if (!$order) {
            return ['can_review' => false, 'reason' => 'Order not found'];
        }
        
        // Check if order belongs to user
        if ($order['buyer_id'] != $userId) {
            return ['can_review' => false, 'reason' => 'Order does not belong to you'];
        }
        
        // Check if order is received
        if ($order['status'] !== 'received') {
            return ['can_review' => false, 'reason' => 'Order must be received before reviewing'];
        }
        
        // Check if within 7 days window
        $receivedAt = strtotime($order['received_at']);
        $now = time();
        $daysSinceReceived = ($now - $receivedAt) / 86400; // seconds to days
        
        if ($daysSinceReceived > self::REVIEW_WINDOW_DAYS) {
            return ['can_review' => false, 'reason' => 'Review window has expired (7 days after received)'];
        }
        
        // Check if product exists in order
        $orderItems = $this->orderRepository->getOrderItems($orderId);
        $productInOrder = false;
        
        foreach ($orderItems as $item) {
            if ($item['product_id'] == $productId) {
                $productInOrder = true;
                break;
            }
        }
        
        if (!$productInOrder) {
            return ['can_review' => false, 'reason' => 'Product not found in this order'];
        }
        
        // Check if already reviewed
        $existingReview = $this->reviewRepository->findByOrderAndProduct($orderId, $productId);
        
        if ($existingReview && $existingReview['deleted_at'] === null) {
            return ['can_review' => false, 'reason' => 'You have already reviewed this product'];
        }
        
        return ['can_review' => true, 'reason' => null];
    }

    /**
     * Submit a new review
     * 
     * @param array $data Review data
     * @return array ['success' => bool, 'review_id' => int|null, 'message' => string]
     */
    public function submitReview($data)
    {
        try {
            // Validate required fields
            if (empty($data['order_id']) || empty($data['product_id']) || empty($data['user_id']) || empty($data['rating'])) {
                return ['success' => false, 'review_id' => null, 'message' => 'Missing required fields'];
            }
            
            // Validate rating
            if (!is_numeric($data['rating']) || $data['rating'] < 1 || $data['rating'] > 5) {
                return ['success' => false, 'review_id' => null, 'message' => 'Rating must be between 1 and 5'];
            }
            
            // Validate comment length
            $comment = $data['comment'] ?? '';
            if (strlen($comment) > self::MAX_COMMENT_LENGTH) {
                return ['success' => false, 'review_id' => null, 'message' => 'Comment exceeds maximum length of ' . self::MAX_COMMENT_LENGTH . ' characters'];
            }
            
            // Check if user can review
            $canReview = $this->canReview($data['order_id'], $data['product_id'], $data['user_id']);
            if (!$canReview['can_review']) {
                return ['success' => false, 'review_id' => null, 'message' => $canReview['reason']];
            }
            
            // Validate images if provided
            $imageFiles = $data['images'] ?? null;
            $imagePaths = [];
            
            if ($imageFiles && !empty($imageFiles['tmp_name'])) {
                $imageValidation = $this->validateImages($imageFiles);
                if (!$imageValidation['valid']) {
                    return ['success' => false, 'review_id' => null, 'message' => $imageValidation['message']];
                }
            }
            
            // Start transaction
            $db = Database::getInstance();
            $db->beginTransaction();
            
            try {
                // Create review
                $reviewData = [
                    'order_id' => (int)$data['order_id'],
                    'user_id' => (int)$data['user_id'],
                    'product_id' => (int)$data['product_id'],
                    'rating' => (int)$data['rating'],
                    'comment' => SanitizerService::sanitizeRichText($comment),
                    'created_at' => date('Y-m-d H:i:s')
                ];
                
                $reviewId = $this->reviewRepository->create($reviewData);
                
                if (!$reviewId) {
                    throw new Exception('Failed to create review');
                }
                
                // Upload and save images if provided
                if ($imageFiles && !empty($imageFiles['tmp_name'])) {
                    $imagePaths = $this->fileService->saveMultipleImages(
                        $imageFiles, 
                        'review_image', 
                        self::MAX_REVIEW_IMAGES
                    );
                    
                    if (!empty($imagePaths)) {
                        $this->reviewImageRepository->createMultiple($reviewId, $imagePaths);
                    }
                }
                
                $db->commit();
                
                return [
                    'success' => true, 
                    'review_id' => $reviewId, 
                    'message' => 'Review submitted successfully'
                ];
                
            } catch (Exception $e) {
                $this->reviewRepository->db->rollback();
                
                // Clean up uploaded images on failure
                foreach ($imagePaths as $path) {
                    $this->fileService->delete($path);
                }
                
                throw $e;
            }
            
        } catch (Exception $e) {
            return ['success' => false, 'review_id' => null, 'message' => 'Error: ' . $e->getMessage()];
        }
    }

    /**
     * Update an existing review
     * 
     * @param int $reviewId
     * @param array $data Updated data
     * @param int $userId User making the update (for authorization)
     * @return array ['success' => bool, 'message' => string]
     */
    public function updateReview($reviewId, $data, $userId)
    {
        try {
            // Get existing review
            $review = $this->reviewRepository->find($reviewId);
            
            if (!$review) {
                return ['success' => false, 'message' => 'Review not found'];
            }
            
            // Check authorization
            if ($review['user_id'] != $userId) {
                return ['success' => false, 'message' => 'You are not authorized to edit this review'];
            }
            
            // Check if deleted
            if ($review['deleted_at'] !== null) {
                return ['success' => false, 'message' => 'Cannot edit a deleted review'];
            }
            
            // Validate rating if provided
            if (isset($data['rating'])) {
                if (!is_numeric($data['rating']) || $data['rating'] < 1 || $data['rating'] > 5) {
                    return ['success' => false, 'message' => 'Rating must be between 1 and 5'];
                }
            }
            
            // Validate comment length if provided
            if (isset($data['comment'])) {
                if (strlen($data['comment']) > self::MAX_COMMENT_LENGTH) {
                    return ['success' => false, 'message' => 'Comment exceeds maximum length of ' . self::MAX_COMMENT_LENGTH . ' characters'];
                }
            }
            
            // Prepare update data
            $updateData = [];
            
            if (isset($data['rating'])) {
                $updateData['rating'] = (int)$data['rating'];
            }
            
            if (isset($data['comment'])) {
                $updateData['comment'] = SanitizerService::sanitizeRichText($data['comment']);
            }
            
            if (empty($updateData)) {
                return ['success' => false, 'message' => 'No data to update'];
            }
            
            // Update review
            $success = $this->reviewRepository->update($reviewId, $updateData);
            
            if (!$success) {
                return ['success' => false, 'message' => 'Failed to update review'];
            }
            
            return ['success' => true, 'message' => 'Review updated successfully'];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }

    /**
     * Soft delete a review
     * 
     * @param int $reviewId
     * @param int $userId User making the deletion (for authorization)
     * @return array ['success' => bool, 'message' => string]
     */
    public function deleteReview($reviewId, $userId)
    {
        try {
            // Get existing review
            $review = $this->reviewRepository->find($reviewId);
            
            if (!$review) {
                return ['success' => false, 'message' => 'Review not found'];
            }
            
            // Check authorization
            if ($review['user_id'] != $userId) {
                return ['success' => false, 'message' => 'You are not authorized to delete this review'];
            }
            
            // Check if already deleted
            if ($review['deleted_at'] !== null) {
                return ['success' => false, 'message' => 'Review is already deleted'];
            }
            
            // Soft delete
            $success = $this->reviewRepository->softDelete($reviewId);
            
            if (!$success) {
                return ['success' => false, 'message' => 'Failed to delete review'];
            }
            
            return ['success' => true, 'message' => 'Review deleted successfully'];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }

    /**
     * Add or update images for a review
     * 
     * @param int $reviewId
     * @param array $imageFiles New images to add
     * @param int $userId For authorization
     * @return array ['success' => bool, 'message' => string]
     */
    public function updateReviewImages($reviewId, $imageFiles, $userId)
    {
        try {
            // Get existing review
            $review = $this->reviewRepository->find($reviewId);
            
            if (!$review || $review['user_id'] != $userId) {
                return ['success' => false, 'message' => 'Review not found or unauthorized'];
            }
            
            // Count existing images
            $existingCount = $this->reviewImageRepository->countByReview($reviewId);
            
            // Validate new images
            $imageValidation = $this->validateImages($imageFiles, $existingCount);
            if (!$imageValidation['valid']) {
                return ['success' => false, 'message' => $imageValidation['message']];
            }
            
            // Upload new images
            $imagePaths = $this->fileService->saveMultipleImages(
                $imageFiles, 
                'review_image', 
                self::MAX_REVIEW_IMAGES - $existingCount
            );
            
            if (!empty($imagePaths)) {
                $this->reviewImageRepository->createMultiple($reviewId, $imagePaths);
            }
            
            return ['success' => true, 'message' => 'Images updated successfully'];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }

    /**
     * Delete a review image
     * 
     * @param int $imageId
     * @param int $userId For authorization
     * @return array ['success' => bool, 'message' => string]
     */
    public function deleteReviewImage($imageId, $userId)
    {
        try {
            // Get image with review info
            $image = $this->reviewImageRepository->findWithReview($imageId);
            
            if (!$image) {
                return ['success' => false, 'message' => 'Image not found'];
            }
            
            // Check authorization
            if ($image['user_id'] != $userId) {
                return ['success' => false, 'message' => 'You are not authorized to delete this image'];
            }
            
            // Delete from storage
            $this->fileService->delete($image['image_url']);
            
            // Delete from database
            $this->reviewImageRepository->deleteImage($imageId);
            
            return ['success' => true, 'message' => 'Image deleted successfully'];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }

    /**
     * Get reviews for a product (public view)
     * 
     * @param int $productId
     * @param int $page
     * @param int $perPage
     * @param int|null $rating Filter by rating (1-5)
     * @param string $sortBy Sort by (newest, oldest, highest, lowest)
     * @return array Paginated reviews with images
     */
    public function getProductReviews($productId, $page = 1, $perPage = 10, $rating = null, $sortBy = 'newest')
    {
        $result = $this->reviewRepository->getByProduct($productId, $page, $perPage, $rating, $sortBy);
        
        // Add images for each review
        foreach ($result['data'] as &$review) {
            $review['images'] = $this->reviewImageRepository->getByReview($review['review_id']);
            $review['responses'] = $this->reviewResponseRepository->getByReview($review['review_id']);
        }
        
        return $result;
    }

    /**
     * Get product rating statistics (alias for getProductRatingStats)
     * 
     * @param int $productId
     * @return array Rating stats and distribution
     */
    public function getProductStats($productId)
    {
        return $this->getProductRatingStats($productId);
    }

    /**
     * Get all reviews for an order (keyed by product_id)
     * 
     * @param int $orderId
     * @return array Associative array with product_id as key
     */
    public function getOrderReviews($orderId)
    {
        $reviews = $this->reviewRepository->getByOrder($orderId);
        
        // Add images for each review
        foreach ($reviews as $productId => &$review) {
            $review['images'] = $this->reviewImageRepository->getByReview($review['review_id']);
        }
        
        return $reviews;
    }

    /**
     * Get a single review by ID
     * 
     * @param int $reviewId
     * @return array|null
     */
    public function getReviewById($reviewId)
    {
        $review = $this->reviewRepository->find($reviewId);
        
        if ($review) {
            $review['images'] = $this->reviewImageRepository->getByReview($reviewId);
        }
        
        return $review;
    }

    /**
     * Get product rating statistics
     * 
     * @param int $productId
     * @return array Rating stats and distribution
     */
    public function getProductRatingStats($productId)
    {
        $stats = $this->reviewRepository->getProductRatingStats($productId);
        $distribution = $this->reviewRepository->getRatingDistribution($productId);
        
        // Convert distribution to format expected by view: [['rating' => X, 'count' => Y], ...]
        $formattedDistribution = [];
        foreach ($distribution as $rating => $count) {
            $formattedDistribution[] = ['rating' => $rating, 'count' => $count];
        }
        
        return array_merge($stats, ['rating_distribution' => $formattedDistribution]);
    }

    /**
     * Get reviews by user (for profile/history)
     * 
     * @param int $userId
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public function getUserReviews($userId, $page = 1, $perPage = 10)
    {
        $result = $this->reviewRepository->getByUser($userId, $page, $perPage);
        
        // Add images for each review
        foreach ($result['data'] as &$review) {
            $review['images'] = $this->reviewImageRepository->getByReview($review['review_id']);
        }
        
        return $result;
    }

    /**
     * Validate uploaded images
     * 
     * @param array $files
     * @param int $existingCount Existing image count
     * @return array ['valid' => bool, 'message' => string|null]
     */
    private function validateImages($files, $existingCount = 0)
    {
        // Check if files array is valid
        if (!isset($files['tmp_name']) || !is_array($files['tmp_name'])) {
            // Single file upload
            if (empty($files['tmp_name'])) {
                return ['valid' => true, 'message' => null];
            }
            $files = [
                'tmp_name' => [$files['tmp_name']],
                'name' => [$files['name']],
                'error' => [$files['error']],
                'size' => [$files['size']]
            ];
        }
        
        $imageCount = 0;
        foreach ($files['tmp_name'] as $key => $tmpName) {
            if ($files['error'][$key] === UPLOAD_ERR_NO_FILE || empty($tmpName)) {
                continue;
            }
            $imageCount++;
        }
        
        // Check max images
        if ($existingCount + $imageCount > self::MAX_REVIEW_IMAGES) {
            return [
                'valid' => false, 
                'message' => 'Maximum ' . self::MAX_REVIEW_IMAGES . ' images allowed per review'
            ];
        }
        
        // Validate each image
        foreach ($files['tmp_name'] as $key => $tmpName) {
            if ($files['error'][$key] === UPLOAD_ERR_NO_FILE || empty($tmpName)) {
                continue;
            }
            
            $singleFile = [
                'name' => $files['name'][$key],
                'tmp_name' => $tmpName,
                'error' => $files['error'][$key],
                'size' => $files['size'][$key]
            ];
            
            // Validate MIME type
            $mimeError = FileService::validateImageMime($singleFile, self::ALLOWED_IMAGE_MIMES);
            if ($mimeError) {
                return ['valid' => false, 'message' => $mimeError];
            }
            
            // Validate size
            $sizeError = FileService::validateImageSize($singleFile, self::MAX_IMAGE_SIZE);
            if ($sizeError) {
                return ['valid' => false, 'message' => $sizeError];
            }
        }
        
        return ['valid' => true, 'message' => null];
    }

    /**
     * Check if seller can respond to a review
     * 
     * @param int $reviewId
     * @param int $sellerId
     * @return array ['can_respond' => bool, 'reason' => string|null]
     */
    public function canRespondToReview($reviewId, $sellerId)
    {
        // Get review with details
        $review = $this->reviewRepository->findWithDetails($reviewId, true);
        
        if (!$review) {
            return ['can_respond' => false, 'reason' => 'Review not found'];
        }
        
        // Check if review is deleted
        if ($review['deleted_at'] !== null) {
            return ['can_respond' => false, 'reason' => 'Cannot respond to deleted review'];
        }
        
        // Get product to verify store ownership
        $product = $this->productRepository->find($review['product_id']);
        
        if (!$product) {
            return ['can_respond' => false, 'reason' => 'Product not found'];
        }
        
        // Check if seller owns the store
        if ($product['store_id'] != $sellerId) {
            return ['can_respond' => false, 'reason' => 'You do not own this store'];
        }
        
        // Check if seller already responded
        $existingResponse = $this->reviewResponseRepository->getByReview($reviewId);
        
        foreach ($existingResponse as $response) {
            if ($response['responder_role'] === 'SELLER' && $response['deleted_at'] === null) {
                return ['can_respond' => false, 'reason' => 'You have already responded to this review'];
            }
        }
        
        return ['can_respond' => true, 'reason' => null];
    }

    /**
     * Submit seller response to a review
     * 
     * @param int $reviewId
     * @param int $sellerId
     * @param string $responseText
     * @return array ['success' => bool, 'message' => string, 'response_id' => int|null]
     */
    public function submitSellerResponse($reviewId, $sellerId, $responseText)
    {
        // Check if seller can respond
        $canRespond = $this->canRespondToReview($reviewId, $sellerId);
        
        if (!$canRespond['can_respond']) {
            return [
                'success' => false,
                'message' => $canRespond['reason'],
                'response_id' => null
            ];
        }
        
        // Validate response text
        $responseText = trim($responseText);
        
        if (empty($responseText)) {
            return [
                'success' => false,
                'message' => 'Response text is required',
                'response_id' => null
            ];
        }
        
        if (strlen($responseText) > self::MAX_COMMENT_LENGTH) {
            return [
                'success' => false,
                'message' => 'Response text exceeds maximum length of ' . self::MAX_COMMENT_LENGTH . ' characters',
                'response_id' => null
            ];
        }
        
        try {
            // Create response
            $responseId = $this->reviewResponseRepository->create([
                'review_id' => $reviewId,
                'responder_id' => $sellerId,
                'responder_role' => 'SELLER',
                'response_text' => $responseText
            ]);
            
            if ($responseId) {
                return [
                    'success' => true,
                    'message' => 'Response submitted successfully',
                    'response_id' => $responseId
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to submit response',
                    'response_id' => null
                ];
            }
            
        } catch (Exception $e) {
            error_log('Error submitting seller response: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while submitting response',
                'response_id' => null
            ];
        }
    }

    /**
     * Update seller response
     * 
     * @param int $responseId
     * @param int $sellerId
     * @param string $responseText
     * @return array ['success' => bool, 'message' => string]
     */
    public function updateSellerResponse($responseId, $sellerId, $responseText)
    {
        // Get response
        $response = $this->reviewResponseRepository->find($responseId);
        
        if (!$response) {
            return ['success' => false, 'message' => 'Response not found'];
        }
        
        // Check if response is deleted
        if ($response['deleted_at'] !== null) {
            return ['success' => false, 'message' => 'Cannot update deleted response'];
        }
        
        // Check ownership
        if ($response['responder_id'] != $sellerId) {
            return ['success' => false, 'message' => 'You do not own this response'];
        }
        
        // Check if it's a seller response
        if ($response['responder_role'] !== 'SELLER') {
            return ['success' => false, 'message' => 'Invalid response type'];
        }
        
        // Validate response text
        $responseText = trim($responseText);
        
        if (empty($responseText)) {
            return ['success' => false, 'message' => 'Response text is required'];
        }
        
        if (strlen($responseText) > self::MAX_COMMENT_LENGTH) {
            return [
                'success' => false,
                'message' => 'Response text exceeds maximum length of ' . self::MAX_COMMENT_LENGTH . ' characters'
            ];
        }
        
        try {
            // Update response
            $updated = $this->reviewResponseRepository->update($responseId, [
                'response_text' => $responseText
            ]);
            
            if ($updated) {
                return [
                    'success' => true,
                    'message' => 'Response updated successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to update response'
                ];
            }
            
        } catch (Exception $e) {
            error_log('Error updating seller response: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while updating response'
            ];
        }
    }

    /**
     * Delete seller response (soft delete)
     * 
     * @param int $responseId
     * @param int $sellerId
     * @return array ['success' => bool, 'message' => string]
     */
    public function deleteSellerResponse($responseId, $sellerId)
    {
        // Get response
        $response = $this->reviewResponseRepository->find($responseId);
        
        if (!$response) {
            return ['success' => false, 'message' => 'Response not found'];
        }
        
        // Check if already deleted
        if ($response['deleted_at'] !== null) {
            return ['success' => false, 'message' => 'Response is already deleted'];
        }
        
        // Check ownership
        if ($response['responder_id'] != $sellerId) {
            return ['success' => false, 'message' => 'You do not own this response'];
        }
        
        // Check if it's a seller response
        if ($response['responder_role'] !== 'SELLER') {
            return ['success' => false, 'message' => 'Invalid response type'];
        }
        
        try {
            // Soft delete
            $deleted = $this->reviewResponseRepository->softDelete($responseId);
            
            if ($deleted) {
                return [
                    'success' => true,
                    'message' => 'Response deleted successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to delete response'
                ];
            }
            
        } catch (Exception $e) {
            error_log('Error deleting seller response: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while deleting response'
            ];
        }
    }

    /**
     * Get reviews for seller's products
     * 
     * @param int $sellerId (store_id)
     * @param int $page
     * @param int $perPage
     * @param string|null $filter (all, unanswered, answered)
     * @return array
     */
    public function getSellerReviews($sellerId, $page = 1, $perPage = 10, $filter = 'all')
    {
        // Get all products for this store
        $products = $this->productRepository->findByStore($sellerId);
        
        if (empty($products)) {
            return [
                'data' => [],
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => 0,
                'total_pages' => 0,
                'has_more' => false
            ];
        }
        
        $productIds = array_map(function($p) { return $p['product_id']; }, $products);
        
        // Get reviews through repository
        $result = $this->reviewRepository->getByProductIds($productIds, $page, $perPage, $filter);
        
        // Add images and responses for each review
        foreach ($result['data'] as &$review) {
            $review['images'] = $this->reviewImageRepository->getByReview($review['review_id']);
            $responses = $this->reviewResponseRepository->getByReview($review['review_id']);
            $review['response'] = !empty($responses) ? $responses[0] : null;
        }
        
        return $result;
    }
}
