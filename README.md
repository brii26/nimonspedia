<div align="center">

<img width="100%" src="img/banner.svg" />

<br/>
<br/>

   <img src="https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white" />
   <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
   <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
   <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
   <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
   <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
   <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
   <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" />
   <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
   <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />

</div>

---

## About

Nimonspedia is a full-featured e-commerce platform built from scratch, with a pure PHP MVC core for the marketplace and a Node.js real-time layer for live chat and auctions. Buyers can browse, search, and purchase products using an internal balance; sellers manage their own stores, inventory, and orders through a dedicated dashboard; and admins oversee the platform via a React-based admin panel.

---

## Features

### Buyer
- **Product Discovery**
  Browse, search by name, and filter products by category or price range across the entire marketplace.
- **Product and Store Details**
  View detailed product information (description, stock, store) and visit individual store pages.
- **Shopping Cart and Checkout**
  Add items to a cart, update quantities, and place orders, with automatic balance and stock validation.
- **Order History**
  View past orders, confirm reception, and track order status in real time.
- **Balance Management**
  Top up account balance via Midtrans, with support for multiple payment methods.
- **Reviews**
  Write rich-text reviews for purchased products and edit them after submission.

### Seller
- **Store Management**
  Register as a seller, and manage store profile including name, logo, and description.
- **Product Management**
  Full CRUD for products within the store, including image upload and category tagging.
- **Order Management**
  View incoming orders and approve or reject them from the seller dashboard.
- **Review Management**
  View buyer reviews on store products and respond to them with rich text.
- **Data Export**
  Export performance reports to Excel/CSV.

### Admin
- **Dashboard Overview**
  View platform-wide statistics including user counts, auction metrics, and review summaries.
- **User Management**
  Browse, search, and manage all users (buyers, sellers, and admins).
- **Review Moderation**
  View and manage product reviews across the platform.
- **Feature Flags**
  Control user access to specific features dynamically.

### Real-Time
- **Live Chat**
  Real-time messaging between buyers and sellers using Socket.io, with typing indicators, unread counts, and product previews.
- **Live Auctions**
  Real-time bidding with live bid updates, countdown timer synchronization, and automatic status transitions.
- **Progressive Web App**
  Installable on mobile and desktop with offline capabilities via service worker.

---

## Tech Stack

| Layer | Technology |
|:---|:---|
| Backend (PHP) | PHP 8.3-FPM, custom MVC, no framework |
| Backend (Node) | Node.js, Express.js, Socket.io, TypeScript |
| Frontend (PHP views) | Vanilla JS, Quill.js (rich text) |
| Frontend (SPA) | React 18, TypeScript, Tailwind CSS, Vite |
| Database | PostgreSQL 16 Alpine |
| Payment | Midtrans SDK |
| Cache / Queue | Redis Alpine |
| Web Server | Nginx (reverse proxy + static files) |
| Containerization | Docker, Docker Compose |
| Process Manager | Supervisor |
| Base Image | Alpine Linux |

---

<!-- ## Screenshots

### Buyer

<div align="center">

| Product Discovery | Product Details |
|:---:|:---:|
| ![Product Discovery](img/product_discovery_page.png) | ![Product Details](img/product_details_page.png) |

| Cart | Checkout |
|:---:|:---:|
| ![Cart](img/cart_page.png) | ![Checkout](img/checkout_page.png) |

| Order History | Store Details |
|:---:|:---:|
| ![Order History](img/order_history_page.png) | ![Store Details](img/store_details_page.png) |

</div>

### Seller

<div align="center">

| Seller Dashboard | Product Management |
|:---:|:---:|
| ![Seller Dashboard](img/seller_dashboard_page.png) | ![Product Management](img/product_management_page.png) |

| Create Product | Order Management |
|:---:|:---:|
| ![Create Product](img/create_product_page.png) | ![Order Management](img/order_management_page.png) |

| Store Management | |
|:---:|:---:|
| ![Store Management](img/update_store_page.png) | |

</div>

### Auth

<div align="center">

| Login | Register |
|:---:|:---:|
| ![Login](img/login_page.png) | ![Register](img/register_page.png) |

| Profile | |
|:---:|:---:|
| ![Profile](img/profile_page.png) | |

</div>

### Admin

<div align="center">

| Admin Dashboard | User Management |
|:---:|:---:|
| ![Admin Dashboard](img/admin_dashboard.png) | ![User Management](img/user_management.png) |

| Review Management | |
|:---:|:---:|
| ![Review Management](img/review_management.png) | |

</div>

### Real-Time

<div align="center">

| Live Chat | Live Auction |
|:---:|:---:|
| ![Live Chat](img/chat_room.png) | ![Live Auction](img/auction_detail.png) |

| Midtrans Checkout | |
|:---:|:---:|
| ![Midtrans Checkout](img/midtrans_checkout.png) | |

</div>

-->

---

## Architecture

Nimonspedia runs two separate backends side by side, each handling a different concern.

**PHP Backend** handles all core marketplace logic: authentication, product management, cart, checkout, orders, and store management. It follows a custom MVC pattern with no framework, serving server-rendered HTML pages via Nginx + PHP-FPM.

**Node.js Backend** handles everything real-time: live chat via Socket.io, live auction bidding, and Midtrans payment callbacks. It runs as a separate Express.js service and communicates with the same PostgreSQL database.

**Frontend** is split in two. The marketplace (buyer/seller flows) is rendered server-side by PHP views with vanilla JS. The admin panel and real-time features (chat, auctions, payment) are a separate React 18 + Vite SPA that talks to the Node.js backend via REST and WebSocket.

**Redis** is shared between both backends: PHP uses it for response caching, and Node.js uses it as a notification queue for web push delivery.

Nginx sits in front of everything, routing `/api` and `/socket.io` traffic to Node.js and everything else to PHP-FPM.

---

## Setup and Run

> **Prerequisites:** Docker, Docker Compose, ports 8080 and 5432 available on the host machine.

### Clone the repository

```bash
git clone https://github.com/brii26/nimonspedia
cd nimonspedia
```

### Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

```env
POSTGRES_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false
```

Generate VAPID keys for web push notifications:

```bash
npx web-push generate-vapid-keys
```

Then paste the output into `.env`:

```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

### Start with Docker

```bash
docker-compose up --build -d
```

### Seed the database

After containers are running, seed the database with initial data and dummy accounts:

```bash
chmod +x scripts/seed.sh
./scripts/seed.sh
```

This seeds the admin account and dummy buyer/seller data. Default credentials after seeding:

| Role | Email | Password |
|:---|:---|:---|
| Admin | admin@nimonspedia.com | admin123 |
| Buyer | buyer1@example.com | i23A567@ |
| Seller | seller1@example.com | i23A567@ |

### Verify

```bash
curl http://localhost:8080
```

### Access

| Service | URL |
|:---|:---|
| Web Application | http://localhost:8080 |
| Node.js API / WebSocket | http://localhost:3000 |
| Database | localhost:5432 (PostgreSQL) |

---

## Project Structure

```
nimonspedia/
├── backend/                   # Node.js + Express + Socket.io server
│   ├── src/
│   │   └── scripts/           # Admin seeder
│   ├── index.ts
│   └── package.json
├── database/
│   └── init.sql
├── frontend/                  # React 18 + Vite SPA (admin panel + real-time)
│   └── src/
├── public/                    # PHP public entry + static assets
│   ├── assets/
│   ├── css/
│   └── js/
├── scripts/
│   └── seed.sh                # One-command database seeder
├── src/                       # PHP MVC core
│   └── app/
│       ├── controllers/
│       ├── services/
│       ├── repository/
│       └── views/
├── storage/                   # Uploaded product images and store logos
├── docker-compose.yml
├── Dockerfile                 # PHP container
├── Dockerfile.nginx           # Nginx container (builds React SPA)
├── nginx.conf
├── php.ini
└── supervisord.conf
```

---

## Authors

<div align="center">

| NIM | Name |
|:---:|:---|
| 13523126 | Brian Ricardo Tamin |
| 13523135 | Ahmad Syafiq |
| 13523149 | Naufarrel Zhafif Abhista |

</div>

---

<div align="center">
   <img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=120&color=0:217a28,100:42b549&section=footer" />
</div>
