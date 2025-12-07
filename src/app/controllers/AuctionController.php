<?php

class AuctionController extends BaseController {
    private $auctionService;

    public function __construct() {
        parent::__construct();
        $this->requireRole('SELLER');
        $this->auctionService = new AuctionService();
    }

public function create() {
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
}