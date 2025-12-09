<?php

class SellerReviewController extends BaseController
{
    private $reviewService;
    private $storeRepository;

    public function __construct()
    {
        parent::__construct();
        $this->reviewService = new ReviewService();
        $this->storeRepository = new StoreRepository();
        
        $this->requireRole('SELLER');
    }

    /**
     * Display list of reviews for seller's products
     * GET /seller/reviews
     */
    public function index()
    {
        $userId = Auth::user()['user_id'];
        
        // Get seller's store
        $store = $this->storeRepository->findByUserId($userId);
        
        if (!$store) {
            $this->redirect('/seller/dashboard?error=store_not_found');
            return;
        }

        // Get pagination and filter parameters
        $page = max(1, (int)$this->getQuery('page', 1));
        $perPage = 10;
        $filter = $this->getQuery('filter', 'all'); // all, unanswered, answered

        // Get reviews for seller's products
        $reviewsData = $this->reviewService->getSellerReviews(
            $store['store_id'],
            $page,
            $perPage,
            $filter
        );

        $hasMore = $reviewsData['has_more'] ?? false;

        // AJAX request - return JSON for infinite scroll
        if ($this->isAjax()) {
            $this->json([
                'success' => true,
                'data' => $reviewsData['data'] ?? [],
                'page' => $page,
                'has_more' => $hasMore
            ]);
            return;
        }

        $this->render('pages/seller/reviews/index', [
            'reviewsData' => $reviewsData,
            'filter' => $filter,
            'store' => $store,
            'hasMore' => $hasMore,
            'currentPage' => $page,
            'pageTitle' => 'Manage Reviews',
            'jsFiles' => [
                '/js/utils/fetchXhr.js',
                '/js/utils/notification.js',
                '/js/pages/seller/reviews/index.js'
            ],
            'cssFiles' => [
                '/css/components.css',
                '/css/components/modal.css',
                '/css/components/notification.css',
                '/css/components/reviews.css',
                '/css/pages/seller/reviews.css'
            ]
        ]);
    }

    /**
     * Show form to respond to a review
     * GET /seller/reviews/respond?review_id=123
     */
    public function respond()
    {
        $reviewId = $this->getQuery('review_id');
        
        if (!$reviewId) {
            $this->redirect('/seller/reviews?error=review_id_required');
            return;
        }

        $userId = Auth::user()['user_id'];
        
        // Get seller's store
        $store = $this->storeRepository->findByUserId($userId);
        
        if (!$store) {
            $this->redirect('/seller/dashboard?error=store_not_found');
            return;
        }

        // Check if seller can respond
        $canRespond = $this->reviewService->canRespondToReview($reviewId, $store['store_id']);
        
        if (!$canRespond['can_respond']) {
            $this->redirect('/seller/reviews?error=' . urlencode($canRespond['reason']));
            return;
        }

        // Get review details
        $reviewRepository = new ReviewRepository();
        $review = $reviewRepository->findWithDetails($reviewId, true);

        $this->render('pages/seller/reviews/respond', [
            'review' => $review,
            'store' => $store,
            'pageTitle' => 'Respond to Review',
            'cssFiles' => [
                '/css/components.css',
                '/css/components/modal.css',
                '/css/components/notification.css',
                '/css/components/reviews.css',
                '/css/pages/reviews.css',
                '/css/pages/seller/reviews.css',
                'https://cdn.quilljs.com/1.3.6/quill.snow.css'
            ],
            'jsFiles' => [
                'https://cdn.quilljs.com/1.3.6/quill.js',
                '/js/utils/quill-setup.js',
                '/js/utils/fetchXhr.js',
                '/js/utils/notification.js',
                '/js/pages/seller/reviews/respond.js'
            ]
        ]);
    }

    /**
     * Submit seller response
     * POST /seller/reviews/respond
     */
    public function submitResponse()
    {
        $userId = Auth::user()['user_id'];
        
        // Get seller's store
        $store = $this->storeRepository->findByUserId($userId);
        
        if (!$store) {
            $this->json(['success' => false, 'message' => 'Store not found'], 404);
            return;
        }

        // Get POST data
        $reviewId = $this->getPost('review_id');
        $responseText = $this->getPost('response_text');

        if (!$reviewId || !$responseText) {
            $this->json(['success' => false, 'message' => 'Review ID and response text are required'], 400);
            return;
        }

        // Submit response
        $result = $this->reviewService->submitSellerResponse(
            $reviewId,
            $store['store_id'],
            $responseText
        );

        $statusCode = $result['success'] ? 200 : 400;
        $this->json($result, $statusCode);
    }

    /**
     * Show form to edit seller response
     * GET /seller/reviews/edit-response?response_id=123
     */
    public function editResponse()
    {
        $responseId = $this->getQuery('response_id');
        
        if (!$responseId) {
            $this->redirect('/seller/reviews?error=response_id_required');
            return;
        }

        $userId = Auth::user()['user_id'];
        
        // Get seller's store
        $store = $this->storeRepository->findByUserId($userId);
        
        if (!$store) {
            $this->redirect('/seller/dashboard?error=store_not_found');
            return;
        }

        // Get response details
        $responseRepository = new ReviewResponseRepository();
        $response = $responseRepository->find($responseId);

        if (!$response) {
            $this->redirect('/seller/reviews?error=response_not_found');
            return;
        }

        // Check ownership
        if ($response['responder_id'] != $store['store_id']) {
            $this->redirect('/seller/reviews?error=unauthorized');
            return;
        }

        // Get review details
        $reviewRepository = new ReviewRepository();
        $review = $reviewRepository->findWithDetails($response['review_id'], true);

        $this->render('pages/seller/reviews/edit-response', [
            'review' => $review,
            'response' => $response,
            'store' => $store,
            'pageTitle' => 'Edit Response',
            'cssFiles' => [
                '/css/components.css',
                '/css/components/modal.css',
                '/css/components/notification.css',
                '/css/components/reviews.css',
                '/css/pages/reviews.css',
                '/css/pages/seller/reviews.css',
                'https://cdn.quilljs.com/1.3.6/quill.snow.css'
            ],
            'jsFiles' => [
                'https://cdn.quilljs.com/1.3.6/quill.js',
                '/js/utils/quill-setup.js',
                '/js/utils/fetchXhr.js',
                '/js/utils/notification.js',
                '/js/pages/seller/reviews/edit-response.js'
            ]
        ]);
    }

    /**
     * Update seller response
     * POST /seller/reviews/update-response
     */
    public function updateResponse()
    {
        $userId = Auth::user()['user_id'];
        
        // Get seller's store
        $store = $this->storeRepository->findByUserId($userId);
        
        if (!$store) {
            $this->json(['success' => false, 'message' => 'Store not found'], 404);
            return;
        }

        // Get POST data
        $responseId = $this->getPost('response_id');
        $responseText = $this->getPost('response_text');

        if (!$responseId || !$responseText) {
            $this->json(['success' => false, 'message' => 'Response ID and response text are required'], 400);
            return;
        }

        // Update response
        $result = $this->reviewService->updateSellerResponse(
            $responseId,
            $store['store_id'],
            $responseText
        );

        $statusCode = $result['success'] ? 200 : 400;
        $this->json($result, $statusCode);
    }

    /**
     * Delete seller response
     * POST /seller/reviews/delete-response
     */
    public function deleteResponse()
    {
        $userId = Auth::user()['user_id'];
        
        // Get seller's store
        $store = $this->storeRepository->findByUserId($userId);
        
        if (!$store) {
            $this->json(['success' => false, 'message' => 'Store not found'], 404);
            return;
        }

        // Get POST data
        $responseId = $this->getPost('response_id');

        if (!$responseId) {
            $this->json(['success' => false, 'message' => 'Response ID is required'], 400);
            return;
        }

        // Delete response
        $result = $this->reviewService->deleteSellerResponse(
            $responseId,
            $store['store_id']
        );

        $statusCode = $result['success'] ? 200 : 400;
        $this->json($result, $statusCode);
    }

    /**
     * Check if request is AJAX
     */
    protected function isAjax(): bool
    {
        return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
    }
}
