<?php

class ReviewController extends BaseController 
{
    private $reviewService;
    private $orderRepository;
    private $productRepository;

    public function __construct() 
    {
        parent::__construct();
        $this->reviewService = new ReviewService();
        $this->orderRepository = new OrderRepository();
        $this->productRepository = new ProductRepository();
    }

    /**
     * Check if user can review a product from an order
     * GET /reviews/can-review?order_id=X&product_id=Y
     */
    public function canReview()
    {
        $this->requireAuth();
        
        try {
            $orderId = (int)$this->getQuery('order_id');
            $productId = (int)$this->getQuery('product_id');
            
            if (!$orderId || !$productId) {
                $this->json([
                    'success' => false,
                    'can_review' => false,
                    'message' => 'Missing order_id or product_id'
                ], 400);
                return;
            }
            
            $userId = Auth::user()['user_id'];
            $result = $this->reviewService->canReview($orderId, $productId, $userId);
            
            $this->json([
                'success' => true,
                'can_review' => $result['can_review'],
                'reason' => $result['reason']
            ]);
            
        } catch (Exception $e) {
            error_log('Error checking can review: ' . $e->getMessage());
            $this->json([
                'success' => false,
                'can_review' => false,
                'message' => 'Error checking review eligibility'
            ], 500);
        }
    }

    /**
     * Submit a new review
     * POST /reviews/submit
     */
    public function submit()
    {
        $this->requireAuth();
        $this->requireRole('BUYER');
        $this->verifyCsrf();
        
        try {
            $data = [
                'order_id' => (int)$this->getPost('order_id'),
                'product_id' => (int)$this->getPost('product_id'),
                'user_id' => Auth::user()['user_id'],
                'rating' => (int)$this->getPost('rating'),
                'comment' => trim($this->getPost('comment', '')),
                'images' => $_FILES['images'] ?? null
            ];
            
            $result = $this->reviewService->submitReview($data);
            
            if ($result['success']) {
                $this->json([
                    'success' => true,
                    'message' => $result['message'],
                    'review_id' => $result['review_id']
                ]);
            } else {
                $this->json([
                    'success' => false,
                    'message' => $result['message']
                ], 422);
            }
            
        } catch (Exception $e) {
            error_log('Error submitting review: ' . $e->getMessage());
            $this->json([
                'success' => false,
                'message' => 'Error submitting review: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing review
     * POST /reviews/update
     */
    public function update()
    {
        $this->requireAuth();
        $this->requireRole('BUYER');
        $this->verifyCsrf();
        
        try {
            $reviewId = (int)$this->getPost('review_id');
            
            if (!$reviewId) {
                $this->json([
                    'success' => false,
                    'message' => 'Missing review_id'
                ], 400);
                return;
            }
            
            $data = [];
            
            if ($this->getPost('rating') !== null) {
                $data['rating'] = (int)$this->getPost('rating');
            }
            
            if ($this->getPost('comment') !== null) {
                $data['comment'] = trim($this->getPost('comment'));
            }
            
            $userId = Auth::user()['user_id'];
            $result = $this->reviewService->updateReview($reviewId, $data, $userId);
            
            if ($result['success']) {
                $this->json([
                    'success' => true,
                    'message' => $result['message']
                ]);
            } else {
                $this->json([
                    'success' => false,
                    'message' => $result['message']
                ], 422);
            }
            
        } catch (Exception $e) {
            error_log('Error updating review: ' . $e->getMessage());
            $this->json([
                'success' => false,
                'message' => 'Error updating review: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a review (soft delete)
     * POST /reviews/delete
     */
    public function delete()
    {
        $this->requireAuth();
        $this->requireRole('BUYER');
        $this->verifyCsrf();
        
        try {
            $reviewId = (int)$this->getPost('review_id');
            
            if (!$reviewId) {
                $this->json([
                    'success' => false,
                    'message' => 'Missing review_id'
                ], 400);
                return;
            }
            
            $userId = Auth::user()['user_id'];
            $result = $this->reviewService->deleteReview($reviewId, $userId);
            
            if ($result['success']) {
                $this->json([
                    'success' => true,
                    'message' => $result['message']
                ]);
            } else {
                $this->json([
                    'success' => false,
                    'message' => $result['message']
                ], 422);
            }
            
        } catch (Exception $e) {
            error_log('Error deleting review: ' . $e->getMessage());
            $this->json([
                'success' => false,
                'message' => 'Error deleting review: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add images to existing review
     * POST /reviews/add-images
     */
    public function addImages()
    {
        $this->requireAuth();
        $this->requireRole('BUYER');
        $this->verifyCsrf();
        
        try {
            $reviewId = (int)$this->getPost('review_id');
            
            if (!$reviewId) {
                $this->json([
                    'success' => false,
                    'message' => 'Missing review_id'
                ], 400);
                return;
            }
            
            if (empty($_FILES['images'])) {
                $this->json([
                    'success' => false,
                    'message' => 'No images provided'
                ], 400);
                return;
            }
            
            $userId = Auth::user()['user_id'];
            $result = $this->reviewService->updateReviewImages($reviewId, $_FILES['images'], $userId);
            
            if ($result['success']) {
                $this->json([
                    'success' => true,
                    'message' => $result['message']
                ]);
            } else {
                $this->json([
                    'success' => false,
                    'message' => $result['message']
                ], 422);
            }
            
        } catch (Exception $e) {
            error_log('Error adding review images: ' . $e->getMessage());
            $this->json([
                'success' => false,
                'message' => 'Error adding images: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a review image
     * POST /reviews/delete-image
     */
    public function deleteImage()
    {
        $this->requireAuth();
        $this->requireRole('BUYER');
        $this->verifyCsrf();
        
        try {
            $imageId = (int)$this->getPost('image_id');
            
            if (!$imageId) {
                $this->json([
                    'success' => false,
                    'message' => 'Missing image_id'
                ], 400);
                return;
            }
            
            $userId = Auth::user()['user_id'];
            $result = $this->reviewService->deleteReviewImage($imageId, $userId);
            
            if ($result['success']) {
                $this->json([
                    'success' => true,
                    'message' => $result['message']
                ]);
            } else {
                $this->json([
                    'success' => false,
                    'message' => $result['message']
                ], 422);
            }
            
        } catch (Exception $e) {
            error_log('Error deleting review image: ' . $e->getMessage());
            $this->json([
                'success' => false,
                'message' => 'Error deleting image: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get reviews for a product (public endpoint)
     * GET /reviews/product?product_id=X&page=1
     */
    public function getProductReviews()
    {
        try {
            $productId = (int)$this->getQuery('product_id');
            
            if (!$productId) {
                $this->json([
                    'success' => false,
                    'message' => 'Missing product_id'
                ], 400);
                return;
            }
            
            $page = (int)$this->getQuery('page', 1);
            $perPage = (int)$this->getQuery('per_page', 10);
            
            $result = $this->reviewService->getProductReviews($productId, $page, $perPage);
            
            $this->json([
                'success' => true,
                'data' => $result['data'],
                'pagination' => [
                    'current_page' => $result['current_page'],
                    'per_page' => $result['per_page'],
                    'total' => $result['total'],
                    'total_pages' => $result['total_pages'],
                    'has_more' => $result['has_more']
                ]
            ]);
            
        } catch (Exception $e) {
            error_log('Error getting product reviews: ' . $e->getMessage());
            $this->json([
                'success' => false,
                'message' => 'Error fetching reviews'
            ], 500);
        }
    }

    /**
     * Get product rating statistics
     * GET /reviews/product-stats?product_id=X
     */
    public function getProductStats()
    {
        try {
            $productId = (int)$this->getQuery('product_id');
            
            if (!$productId) {
                $this->json([
                    'success' => false,
                    'message' => 'Missing product_id'
                ], 400);
                return;
            }
            
            $stats = $this->reviewService->getProductRatingStats($productId);
            
            $this->json([
                'success' => true,
                'data' => $stats
            ]);
            
        } catch (Exception $e) {
            error_log('Error getting product stats: ' . $e->getMessage());
            $this->json([
                'success' => false,
                'message' => 'Error fetching stats'
            ], 500);
        }
    }

    /**
     * Get user's reviews (for profile/history page)
     * GET /reviews/my-reviews?page=1
     */
    public function myReviews()
    {
        $this->requireAuth();
        $this->requireRole('BUYER');
        
        try {
            $page = (int)$this->getQuery('page', 1);
            $perPage = (int)$this->getQuery('per_page', 10);
            $userId = Auth::user()['user_id'];
            
            $result = $this->reviewService->getUserReviews($userId, $page, $perPage);
            
            // If AJAX request, return JSON for infinite scroll
            if ($this->isAjax()) {
                $this->json([
                    'success' => true,
                    'data' => $result['data'],
                    'page' => $page,
                    'has_more' => $result['has_more'] ?? false
                ]);
                return;
            }
            
            // Otherwise render page
            $this->render('pages/reviews/my-reviews', [
                'reviews' => $result['data'],
                'pagination' => $result,
                'pageTitle' => 'My Reviews',
                'cssFiles' => [
                    '/css/components.css',
                    '/css/components/modal.css',
                    '/css/components/notification.css',
                    '/css/components/reviews.css',
                    '/css/pages/reviews.css'
                ],
                'jsFiles' => [
                    '/js/utils/fetchXhr.js',
                    '/js/utils/notification.js',
                    '/js/pages/reviews/my-reviews.js'
                ]
            ]);
            
        } catch (Exception $e) {
            error_log('Error getting user reviews: ' . $e->getMessage());
            
            if ($this->isAjax()) {
                $this->json([
                    'success' => false,
                    'message' => 'Error fetching reviews'
                ], 500);
                return;
            }
            
            $this->render('pages/reviews/my-reviews', [
                'reviews' => [],
                'pagination' => ['total' => 0, 'total_pages' => 0],
                'error' => 'Failed to load reviews',
                'pageTitle' => 'My Reviews',
                'cssFiles' => [
                    '/css/components.css',
                    '/css/components/modal.css',
                    '/css/components/notification.css',
                    '/css/components/reviews.css',
                    '/css/pages/reviews.css'
                ],
                'jsFiles' => ['/js/utils/fetchXhr.js']
            ]);
        }
    }

    /**
     * Show review form page
     * GET /reviews/create?order_id=X&product_id=Y
     */
    public function create()
    {
        $this->requireAuth();
        $this->requireRole('BUYER');
        
        try {
            $orderId = (int)$this->getQuery('order_id');
            $productId = (int)$this->getQuery('product_id');
            
            if (!$orderId || !$productId) {
                $this->redirect('/orders');
                return;
            }
            
            // Check eligibility
            $userId = Auth::user()['user_id'];
            $canReview = $this->reviewService->canReview($orderId, $productId, $userId);
            
            if (!$canReview['can_review']) {
                $_SESSION['error_message'] = $canReview['reason'];
                $this->redirect('/orders?id=' . $orderId);
                return;
            }
            
            // Get product and order info
            $product = $this->productRepository->find($productId);
            $order = $this->orderRepository->find($orderId);
            
            if (!$product || !$order) {
                $this->redirect('/orders');
                return;
            }
            
            $this->render('pages/reviews/create', [
                'product' => $product,
                'order' => $order,
                'pageTitle' => 'Write a Review',
                'cssFiles' => [
                    '/css/components.css',
                    '/css/components/modal.css',
                    '/css/components/notification.css',
                    '/css/components/reviews.css',
                    '/css/pages/reviews.css',
                    'https://cdn.quilljs.com/1.3.6/quill.snow.css'
                ],
                'jsFiles' => [
                    '/js/utils/fetchXhr.js',
                    '/js/utils/notification.js',
                    '/js/components/star-rating.js',
                    'https://cdn.quilljs.com/1.3.6/quill.js',
                    '/js/utils/quill-setup.js',
                    '/js/pages/reviews/create.js'
                ]
            ]);
            
        } catch (Exception $e) {
            error_log('Error showing review form: ' . $e->getMessage());
            $this->redirect('/orders');
        }
    }

    /**
     * Show edit review form page
     * GET /reviews/edit?review_id=X
     */
    public function edit()
    {
        $this->requireAuth();
        $this->requireRole('BUYER');
        
        try {
            $reviewId = (int)$this->getQuery('review_id');
            
            if (!$reviewId) {
                $this->redirect('/reviews/my-reviews');
                return;
            }
            
            $reviewRepo = new ReviewRepository();
            $review = $reviewRepo->findWithDetails($reviewId);
            
            if (!$review || $review['user_id'] != Auth::user()['user_id']) {
                $this->redirect('/reviews/my-reviews');
                return;
            }
            
            if ($review['deleted_at'] !== null) {
                $_SESSION['error_message'] = 'Cannot edit a deleted review';
                $this->redirect('/reviews/my-reviews');
                return;
            }
            
            // Get images
            $reviewImageRepo = new ReviewImageRepository();
            $images = $reviewImageRepo->getByReview($reviewId);
            
            $this->render('pages/reviews/edit', [
                'review' => $review,
                'images' => $images,
                'pageTitle' => 'Edit Review',
                'cssFiles' => [
                    '/css/components.css',
                    '/css/components/modal.css',
                    '/css/components/notification.css',
                    '/css/components/reviews.css',
                    '/css/pages/reviews.css',
                    'https://cdn.quilljs.com/1.3.6/quill.snow.css'
                ],
                'jsFiles' => [
                    '/js/utils/fetchXhr.js',
                    '/js/utils/notification.js',
                    '/js/components/star-rating.js',
                    'https://cdn.quilljs.com/1.3.6/quill.js',
                    '/js/utils/quill-setup.js',
                    '/js/pages/reviews/edit.js'
                ]
            ]);
            
        } catch (Exception $e) {
            error_log('Error showing edit review form: ' . $e->getMessage());
            $this->redirect('/reviews/my-reviews');
        }
    }
}
