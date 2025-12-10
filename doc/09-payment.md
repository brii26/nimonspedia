# Payment Gateway Integration (Midtrans)

This document details the implementation of the Payment Gateway feature using Midtrans Snap API, integrated into the existing Hybrid PHP + Node.js/React architecture.

## 1. Environment & Architecture Changes

### **Architecture Overview**
The Payment Gateway implementation follows a "Backend-for-Frontend" pattern where Node.js acts as the orchestrator:
*   **PHP Frontend (Legacy):** Intercepts "Top Up" requests and forwards them to Node.js API.
*   **React Frontend (New):** Provides a dedicated "Payment Status" page for polling transaction status.
*   **Node.js Backend:** Handles Midtrans API calls (Snap Token), processes Webhooks, manages `payment_transactions` database, and sends Push Notifications.
*   **Database:** A shared PostgreSQL database ensures atomicity between payment status and user balance updates.

### **New Environment Variables (`.env`)**
The following variables must be added to your `.env` file:

```env
# Midtrans Configuration
MIDTRANS_SERVER_KEY=SB-Mid-server-XXXXX  # Get from Midtrans Dashboard
MIDTRANS_CLIENT_KEY=SB-Mid-client-XXXXX  # Get from Midtrans Dashboard
MIDTRANS_IS_PRODUCTION=false

# Client URL (Used for Midtrans Redirects)
# For local dev with Ngrok: https://your-ngrok.ngrok-free.app
CLIENT_URL=http://localhost:8080
```

### **Database Schema Changes**
A new table `payment_transactions` was added to `init.sql`:
*   `transaction_id`: PK
*   `user_id`: FK to `users`
*   `amount`: BIGINT (Transaction amount)
*   `payment_type`: ENUM ('topup', 'order_payment')
*   `order_id`: Nullable FK (for order payments)
*   `status`: ENUM ('pending', 'success', 'failed', 'expired')
*   `external_id`: Unique ID sent to Midtrans
*   `snap_token`: Token for Snap Popup

## 2. Changes at PHP (Legacy Backend/Frontend)

### **Authentication Core (`src/core/Auth.php`)**
*   **Real-time Balance Sync:** Modified `Auth::user()` to **always fetch the fresh balance from the database** instead of relying on stale session data. This fixes the issue where balance appeared unchanged after a top-up redirect.

### **Profile Page (`public/js/pages/auth/profile.js`)**
*   **AJAX Interception:** The "Top Up" form submission is intercepted by JavaScript.
*   **API Call:** Instead of submitting to a PHP controller, it performs a `fetch` POST request to the Node.js endpoint `/api/node/payment/initiate`.
*   **Redirect:** Upon receiving a success response with a `redirectUrl`, the browser redirects the user to the Midtrans Snap payment page.

### **Controllers (`AuthController.php`)**
*   The legacy `topUp` method is bypassed by the new JS flow but kept for fallback/reference.

## 3. Changes at Node.js & React (Modern Stack)

### **Node.js Backend (`server/`)**
*   **Dependencies:** Added `midtrans-client` for API integration.
*   **New Modules:**
    *   `src/repositories/paymentRepository.ts`: Handles DB operations (Create Transaction, Atomic Balance Update).
    *   `src/services/paymentService.ts`: Orchestrates Midtrans API calls, generates Order IDs, verifies Webhook Signatures, and triggers Push Notifications.
    *   `src/controllers/paymentController.ts`: Handles HTTP requests for Initiation, Status Check, and Webhook.
    *   `src/routes/paymentRoutes.ts`: Defines endpoints `/initiate`, `/webhook`, and `/status/:externalId`.
*   **Main Application (`index.ts`):** Registered `paymentRoutes` with prefix `/payment`.

### **React Frontend (`client/`)**
*   **New Page:** `src/views/pages/PaymentStatus.tsx`.
    *   Displays a loading spinner while verifying payment status.
    *   Polls the backend API (`/api/node/payment/status/:id`) every 3 seconds.
    *   Handles success/failure UI and redirects user back to Profile or Order page.
*   **Routing:** Added `/payments/status` route in `App.tsx`.

### **Infrastructure (Nginx)**
*   Updated `nginx.conf` to explicitly route requests starting with `/payments` to the React application (`index.html`), preventing 404 errors from the PHP router.

## 4. How to Run the Payment Gateway (Development)

To test the full end-to-end flow with Webhooks in a local environment, you **must** use a tunneling tool like Ngrok because Midtrans cannot send webhooks to `localhost`.

### **Step 1: Start Ngrok**
Run Ngrok to expose your Nginx port (mapped to 8080 on host):
```bash
ngrok http 8080
```
Copy the HTTPS URL generated (e.g., `https://abcd-123.ngrok-free.app`).

### **Step 2: Configure Midtrans Dashboard**
1.  Login to [Midtrans Sandbox Dashboard](https://dashboard.sandbox.midtrans.com/).
2.  Go to **Settings > Configuration**.
3.  Set **Notification URL** to:
    `https://[YOUR_NGROK_URL]/api/node/payment/webhook`
4.  Save.

### **Step 3: Configure Local Environment**
1.  Update `.env` file:
    ```env
    CLIENT_URL=https://[YOUR_NGROK_URL]
    ```
2.  Restart Node.js container to apply changes:
    ```bash
    docker-compose restart node-server
    ```

### **Step 4: Test Flow**
1.  Open your app via the **Ngrok URL** (e.g., `https://abcd-123.ngrok-free.app`). Login as Buyer.
2.  Go to **Profile** > Enter Top Up Amount > Click **Top Up**.
3.  You will be redirected to Midtrans Snap. Select payment (e.g., BCA VA).
4.  In Midtrans Simulator (if redirect doesn't auto-open), copy the VA number and use the Simulator to "Pay".
5.  After payment, you will be redirected back to the **Payment Status Page** (`/payments/status`).
6.  The page should poll and show **"Payment Successful"**.
7.  Click "Continue" to return to Profile. Your **Balance** should now be updated.
