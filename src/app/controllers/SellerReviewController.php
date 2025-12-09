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
    }

    /**
     * Display list of reviews for seller's products
     * GET /seller/reviews
     */
    public function index()
    {
        // Check if user is seller
        if (!$this->isLoggedIn() || $this->getSessionData('role') !== 'SELLER') {
            $this->redirect('/login');
            return;
        }

        $userId = $this->getSessionData('user_id');
        
        // Get seller's store
        $store = $this->storeRepository->findByUserId($userId);
        
        if (!$store) {
            $this->setFlashMessage('error', 'Store not found');
            $this->redirect('/seller/dashboard');
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

        $this->render('pages/seller/reviews/index', [
            'reviewsData' => $reviewsData,
            'filter' => $filter,
            'store' => $store,
            'pageTitle' => 'Manage Reviews',
            'jsFiles' => [
                '/js/utils/fetchXhr.js',
                '/js/pages/seller/reviews/index.js'
            ],
            'cssFiles' => [
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
        // Check if user is seller
        if (!$this->isLoggedIn() || $this->getSessionData('role') !== 'SELLER') {
            $this->redirect('/login');
            return;
        }

        $reviewId = $this->getQuery('review_id');
        
        if (!$reviewId) {
            $this->setFlashMessage('error', 'Review ID is required');
            $this->redirect('/seller/reviews');
            return;
        }

        $userId = $this->getSessionData('user_id');
        
        // Get seller's store
        $store = $this->storeRepository->findByUserId($userId);
        
        if (!$store) {
            $this->setFlashMessage('error', 'Store not found');
            $this->redirect('/seller/dashboard');
            return;
        }

        // Check if seller can respond
        $canRespond = $this->reviewService->canRespondToReview($reviewId, $store['store_id']);
        
        if (!$canRespond['can_respond']) {
            $this->setFlashMessage('error', $canRespond['reason']);
            $this->redirect('/seller/reviews');
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
                '/css/pages/seller/reviews.css',
                'https://cdn.quilljs.com/1.3.6/quill.snow.css'
            ],
            'jsFiles' => [
                'https://cdn.quilljs.com/1.3.6/quill.js',
                '/js/utils/quill-setup.js',
                '/js/utils/fetchXhr.js',
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
        // Check if user is seller
        if (!$this->isLoggedIn() || $this->getSessionData('role') !== 'SELLER') {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }

        $userId = $this->getSessionData('user_id');
        
        // Get seller's store
        $store = $this->storeRepository->findByUserId($userId);
        
        if (!$store) {
            $this->jsonResponse(['success' => false, 'message' => 'Store not found'], 404);
            return;
        }

        // Get POST data
        $reviewId = $this->getPost('review_id');
        $responseText = $this->getPost('response_text');

        if (!$reviewId || !$responseText) {
            $this->jsonResponse(['success' => false, 'message' => 'Review ID and response text are required'], 400);
            return;
        }

        // Submit response
        $result = $this->reviewService->submitSellerResponse(
            $reviewId,
            $store['store_id'],
            $responseText
        );

        $statusCode = $result['success'] ? 200 : 400;
        $this->jsonResponse($result, $statusCode);
    }

    /**
     * Show form to edit seller response
     * GET /seller/reviews/edit-response?response_id=123
     */
    public function editResponse()
    {
        // Check if user is seller
        if (!$this->isLoggedIn() || $this->getSessionData('role') !== 'SELLER') {
            $this->redirect('/login');
            return;
        }

        $responseId = $this->getQuery('response_id');
        
        if (!$responseId) {
            $this->setFlashMessage('error', 'Response ID is required');
            $this->redirect('/seller/reviews');
            return;
        }

        $userId = $this->getSessionData('user_id');
        
        // Get seller's store
        $store = $this->storeRepository->findByUserId($userId);
        
        if (!$store) {
            $this->setFlashMessage('error', 'Store not found');
            $this->redirect('/seller/dashboard');
            return;
        }

        // Get response details
        $responseRepository = new ReviewResponseRepository();
        $response = $responseRepository->find($responseId);

        if (!$response) {
            $this->setFlashMessage('error', 'Response not found');
            $this->redirect('/seller/reviews');
            return;
        }

        // Check ownership
        if ($response['responder_id'] != $store['store_id']) {
            $this->setFlashMessage('error', 'You do not own this response');
            $this->redirect('/seller/reviews');
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
                '/css/pages/seller/reviews.css',
                'https://cdn.quilljs.com/1.3.6/quill.snow.css'
            ],
            'jsFiles' => [
                'https://cdn.quilljs.com/1.3.6/quill.js',
                '/js/utils/quill-setup.js',
                '/js/utils/fetchXhr.js',
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
        // Check if user is seller
        if (!$this->isLoggedIn() || $this->getSessionData('role') !== 'SELLER') {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }

        $userId = $this->getSessionData('user_id');
        
        // Get seller's store
        $store = $this->storeRepository->findByUserId($userId);
        
        if (!$store) {
            $this->jsonResponse(['success' => false, 'message' => 'Store not found'], 404);
            return;
        }

        // Get POST data
        $responseId = $this->getPost('response_id');
        $responseText = $this->getPost('response_text');

        if (!$responseId || !$responseText) {
            $this->jsonResponse(['success' => false, 'message' => 'Response ID and response text are required'], 400);
            return;
        }

        // Update response
        $result = $this->reviewService->updateSellerResponse(
            $responseId,
            $store['store_id'],
            $responseText
        );

        $statusCode = $result['success'] ? 200 : 400;
        $this->jsonResponse($result, $statusCode);
    }

    /**
     * Delete seller response
     * POST /seller/reviews/delete-response
     */
    public function deleteResponse()
    {
        // Check if user is seller
        if (!$this->isLoggedIn() || $this->getSessionData('role') !== 'SELLER') {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }

        $userId = $this->getSessionData('user_id');
        
        // Get seller's store
        $store = $this->storeRepository->findByUserId($userId);
        
        if (!$store) {
            $this->jsonResponse(['success' => false, 'message' => 'Store not found'], 404);
            return;
        }

        // Get POST data
        $responseId = $this->getPost('response_id');

        if (!$responseId) {
            $this->jsonResponse(['success' => false, 'message' => 'Response ID is required'], 400);
            return;
        }

        // Delete response
        $result = $this->reviewService->deleteSellerResponse(
            $responseId,
            $store['store_id']
        );

        $statusCode = $result['success'] ? 200 : 400;
        $this->jsonResponse($result, $statusCode);
    }
}
