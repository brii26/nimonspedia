<?php

/**
 * ChatController
 * 
 * Handles chat-related API endpoints for integration with Node.js Socket Server
 * This controller acts as a bridge between PHP backend and React/Node.js chat system
 */
class ChatController extends BaseController {
    
    /**
     * Initialize chat room
     * Called when buyer clicks "Chat Penjual" button
     * 
     * POST /api/chat/initiate
     * Body: { storeId: number }
     * 
     * Returns: { 
     *   success: true, 
     *   data: { 
     *     store_id, 
     *     buyer_id, 
     *     store_name,
     *     room_id: "store_{store_id}_user_{buyer_id}" 
     *   } 
     * }
     * 
     * Note: Actual room creation handled by Node.js Socket Server
     * This endpoint verifies store exists and returns data for client
     */
    public function initiate() {
        // Check if user is authenticated
        if (!Auth::check()) {
            return $this->jsonResponse([
                'success' => false,
                'message' => 'Unauthorized. Please login first.'
            ], 401);
        }

        $user = Auth::user();
        
        require_once __DIR__ . '/../services/FeatureFlagService.php';
        $access = FeatureFlagService::checkAccess($user['user_id'], 'chat_enabled');
        if (!$access['allowed']) {
             return $this->jsonResponse([
                'success' => false,
                'message' => 'Fitur Chat Dimatikan: ' . $access['reason']
            ], 503);
        }

        // Only buyers can initiate chat
        if ($user['role'] !== 'BUYER') {
            return $this->jsonResponse([
                'success' => false,
                'message' => 'Only buyers can initiate chat with sellers.'
            ], 403);
        }

        // Get storeId from request
        $requestBody = $this->getJsonBody();
        $storeId = $requestBody['storeId'] ?? null;

        if (!$storeId) {
            return $this->jsonResponse([
                'success' => false,
                'message' => 'Store ID is required.'
            ], 400);
        }

        try {
            // Verify store exists
            $storeRepo = new StoreRepository();
            $store = $storeRepo->findById($storeId);

            if (!$store) {
                return $this->jsonResponse([
                    'success' => false,
                    'message' => 'Store not found.'
                ], 404);
            }

            // Return data needed for chat initialization
            // Format room_id sesuai spesifikasi: store_{store_id}_user_{buyer_id}
            // The actual room creation is handled by Node.js socket server
            $roomId = "store_{$store['store_id']}_user_{$user['user_id']}";
            
            $this->jsonResponse([
                'success' => true,
                'data' => [
                    'store_id' => (int)$store['store_id'],
                    'buyer_id' => (int)$user['user_id'],
                    'store_name' => $store['store_name'],
                    'store_image' => $store['store_logo_path'] ?? null,
                    'buyer_name' => $user['username'],
                    'room_id' => $roomId  // Format: store_5_user_42
                ]
            ]);

        } catch (Exception $e) {
            error_log("Chat initiate error: " . $e->getMessage());
            
            return $this->jsonResponse([
                'success' => false,
                'message' => 'Failed to initiate chat. Please try again.'
            ], 500);
        }
    }

    /**
     * Get chat rooms for current user
     * This endpoint can be called by Node.js server or React frontend
     * to get list of chat rooms
     * 
     * GET /api/chat/rooms
     */
    public function getRooms() {
        if (!Auth::check()) {
            return $this->jsonResponse([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $user = Auth::user();

        try {
            // This is a placeholder - actual chat history is stored in Node.js/MongoDB
            // This endpoint can be extended to fetch from your chat database if needed
            
            $this->jsonResponse([
                'success' => true,
                'data' => [],
                'message' => 'Chat rooms should be fetched from Node.js server'
            ]);

        } catch (Exception $e) {
            error_log("Get chat rooms error: " . $e->getMessage());
            
            return $this->jsonResponse([
                'success' => false,
                'message' => 'Failed to fetch chat rooms.'
            ], 500);
        }
    }

    /**
     * Helper: Get JSON body from request
     */
    private function getJsonBody() {
        $rawBody = file_get_contents('php://input');
        return json_decode($rawBody, true) ?? [];
    }

    /**
     * Helper: Send JSON response
     */
    private function jsonResponse($data, $statusCode = 200) {
        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: application/json');
        }
        
        echo json_encode($data);
        exit;
    }
}
