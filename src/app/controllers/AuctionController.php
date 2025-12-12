<?php

class AuctionController extends BaseController {
    private $auctionService;
    public function __construct() {
        parent::__construct();
        $this->auctionService = new AuctionService();
    }

    public function create() {
        $this->requireRole('SELLER');
        
        require_once __DIR__ . '/../services/FeatureFlagService.php';
        $access = FeatureFlagService::checkAccess(Auth::id(), 'auction_enabled');
        if (!$access['allowed']) {
            $this->redirect('/seller/products?error=' . urlencode('Fitur Lelang Dimatikan: ' . $access['reason']));
            return;
        }

        $post = $this->getPost();

        try {
            $this->verifyCsrf();

            $this->validate($post, [
                'product_id' => ['required', 'numeric'],
                'start_time' => ['required'],
                'end_time'   => ['required'],
                'quantity' => ['required', 'numeric', 'numeric_min:1'],
                'start_price' => ['required', 'numeric', 'numeric_min:1000'],
                'min_increment' => ['required', 'numeric', 'numeric_min:100']
            ]);

            $start = strtotime($post['start_time']);
            $end = strtotime($post['end_time']);
            $now = time();

            if ($start <= $now) {
                throw new Exception("Start time must be in the future.");
            }
            if ($end <= $start) {
                throw new Exception("End time must be after start time.");
            }

            $this->auctionService->createAuction($post);
            $this->redirect('/seller/products?status=auction_created');

        } catch (ValidationException $e) {
            $this->redirect('/seller/products?error=' . urlencode($e->getFirstError()));
        } catch (Exception $e) {
            $this->redirect('/seller/products?error=' . urlencode($e->getMessage()));
        }
    }

    public function list() {
        header('Content-Type: application/json');
        
        require_once __DIR__ . '/../services/FeatureFlagService.php';
        $access = FeatureFlagService::checkAccess(Auth::id(), 'auction_enabled');
        if (!$access['allowed']) {
            http_response_code(503);
            echo json_encode(['success' => false, 'message' => 'Fitur Lelang Dimatikan: ' . $access['reason']]);
            exit;
        }

        try {
            $productId = (int)$this->getQuery('product_id');
            
            if (!$productId) {
                throw new Exception("Product ID is missing.");
            }
            // Fetch Data
            $auctions = $this->auctionService->getAuctionsByProduct($productId);
            echo json_encode([
                'success' => true, 
                'data' => $auctions
            ]);
            exit;

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false, 
                'message' => $e->getMessage()
            ]);
            exit;
        }
    }

    public function cancel() {
        $this->requireRole('SELLER');
        header('Content-Type: application/json');
        
        require_once __DIR__ . '/../services/FeatureFlagService.php';
        $access = FeatureFlagService::checkAccess(Auth::id(), 'auction_enabled');
        if (!$access['allowed']) {
            http_response_code(503);
            echo json_encode(['success' => false, 'message' => 'Fitur Lelang Dimatikan: ' . $access['reason']]);
            exit;
        }

        try {
            $rawInput = file_get_contents('php://input');
            $jsonData = json_decode($rawInput, true);
            $auctionId = $jsonData['auction_id'] ?? $_POST['auction_id'] ?? null;

            // Validasi Store
            $storeService = new StoreService();
            $storeId = $storeService->getSellerStoreId();
            if (!$storeId) throw new Exception("Store not found.");

            // Cancel 
            $this->auctionService->cancelAuction($auctionId, $storeId);
            echo json_encode(['success' => true]);
            exit;

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false, 
                'message' => $e->getMessage()
            ]);
            exit;
        }
    }

    public function getAuctions() {
        header('Content-Type: application/json');
        
        require_once __DIR__ . '/../services/FeatureFlagService.php';
        $access = FeatureFlagService::checkAccess(Auth::id(), 'auction_enabled');
        if (!$access['allowed']) {
            http_response_code(503);
            echo json_encode(['success' => false, 'message' => 'Fitur Lelang Dimatikan: ' . $access['reason']]);
            exit;
        }
            
        try {
            $params = [
                'page' => (int)$this->getQuery('page', 1),
                'perPage' => 12,
                'searchTerm' => $this->getQuery('search'),
                'status' => $this->getQuery('status', 'ACTIVE')
            ];

            $result = $this->auctionService->getAuctionsForBuyer($params);
            
            echo json_encode([
                'success' => true,
                'data' => $result['data'],
                'pagination' => [
                    'currentPage' => $params['page'],
                    'totalPages' => ceil($result['total'] / $params['perPage']),
                    'totalItems' => $result['total']
                ]
            ]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            exit;
        }
    }
}