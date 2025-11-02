<?php

class SellerOrdersController extends BaseController {
    private $sellerOrderService;
    private $storeService;

    public function __construct() {
        parent::__construct();
        $this->sellerOrderService = new SellerOrderService();
        $this->storeService = new StoreService();
        
        $this->requireRole('SELLER');
    }

    private function getSellerStoreId(): ?int {
        $storeId = $this->storeService->getSellerStoreId();
        if (!$storeId) {
            $this->redirect('/?error=no_store');
            return null;
        }
        return $storeId;
    }

    public function index() {
        $storeId = $this->getSellerStoreId();
        if (!$storeId) return;

        $status = $this->getQuery('status');
        $search = $this->getQuery('search');
        $page = (int) $this->getQuery('page', 1);
        
        $ordersData = $this->sellerOrderService->getOrders($storeId, $status, $search, $page);

		$jsFiles = [
			'/js/utils/fetchXHR.js',
			'/js/pages/seller/orders.js',
			'/js/utils/quill-setup.js'
		];
		$cssFiles = [
			'/css/pages/seller/orders.css'
		];
        
        $this->render('pages/seller/orders/index', array_merge([
            'ordersData' => $ordersData,
            'currentStatus' => $status,
            'search' => $search,
            'currentPage' => $page
		], [
			'jsFiles' => $jsFiles,
			'cssFiles' => $cssFiles
		]));
    }

    public function showOrder() {
        $storeId = $this->getSellerStoreId();
        if (!$storeId) return;

        $orderId = (int) $this->getQuery('id');
        if ($orderId <= 0) {
            $this->redirect('/seller/orders?error=invalid_id');
            return;
        }

        $order = $this->sellerOrderService->getOrderDetail($orderId, $storeId);
        if (!$order) {
            $this->redirect('/seller/orders?error=not_found');
            return;
        }

        if ($this->getQuery('format') === 'json') {
            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'data' => $order]);
            exit;
        }

        $this->render('pages/seller/orders/show', ['order' => $order]);
    }

    public function approve() {
        $storeId = $this->getSellerStoreId();
        if (!$storeId) return;

        try {
            $this->verifyCsrf();
            $orderId = (int) $this->getPost('order_id');

            if ($this->sellerOrderService->approveOrder($orderId, $storeId)) {
                if ($this->isAjax()) {
                    $this->jsonResponse(['success' => true]);
                } else {
                    $this->redirect("/seller/orders?status=waiting_approval&message=order_approved");
                }
            } else {
                throw new Exception("Failed to approve order");
            }
        } catch (Exception $e) {
            if ($this->isAjax()) {
                $this->jsonResponse(['success' => false, 'message' => $e->getMessage()]);
            } else {
                $this->redirect("/seller/orders?error=" . urlencode($e->getMessage()));
            }
        }
    }

    public function reject() {
        $storeId = $this->getSellerStoreId();
        if (!$storeId) return;

        try {
            $this->verifyCsrf();
            $post = $this->getPost();
            $orderId = (int) $post['order_id'];
            $reason = trim($post['reject_reason'] ?? '');

            if (empty($reason)) {
                throw new ValidationException(['reject_reason' => 'Reason is required']);
            }

            if ($this->sellerOrderService->rejectOrder($orderId, $storeId, $reason)) {
                if ($this->isAjax()) {
                    $this->jsonResponse(['success' => true]);
                } else {
                    $this->redirect("/seller/orders?status=waiting_approval&message=order_rejected");
                }
            } else {
                throw new Exception("Failed to reject order");
            }
        } catch (ValidationException $e) {
            if ($this->isAjax()) {
                $this->jsonResponse(['success' => false, 'message' => $e->getFirstError()]);
            } else {
                $this->redirect("/seller/orders?error=" . urlencode($e->getFirstError()));
            }
        } catch (Exception $e) {
            if ($this->isAjax()) {
                $this->jsonResponse(['success' => false, 'message' => $e->getMessage()]);
            } else {
                $this->redirect("/seller/orders?error=" . urlencode($e->getMessage()));
            }
        }
    }

    public function setDelivery() {
        $storeId = $this->getSellerStoreId();
        if (!$storeId) return;

        try {
            $this->verifyCsrf();
            $post = $this->getPost();
            $orderId = (int) $post['order_id'];
            $deliveryTime = trim($post['delivery_time'] ?? '');

            if (empty($deliveryTime)) {
                throw new ValidationException(['delivery_time' => 'Delivery time is required']);
            }

            if ($this->sellerOrderService->setDeliveryTime($orderId, $storeId, $deliveryTime)) {
                if ($this->isAjax()) {
                    $this->jsonResponse(['success' => true]);
                } else {
                    $this->redirect("/seller/orders?status=approved&message=delivery_set");
                }
            } else {
                throw new Exception("Failed to set delivery time");
            }
        } catch (ValidationException $e) {
            if ($this->isAjax()) {
                $this->jsonResponse(['success' => false, 'message' => $e->getFirstError()]);
            } else {
                $this->redirect("/seller/orders?error=" . urlencode($e->getFirstError()));
            }
        } catch (Exception $e) {
            if ($this->isAjax()) {
                $this->jsonResponse(['success' => false, 'message' => $e->getMessage()]);
            } else {
                $this->redirect("/seller/orders?error=" . urlencode($e->getMessage()));
            }
        }
    }

    protected function isAjax(): bool {
        return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
    }

    protected function jsonResponse(array $data) {
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}