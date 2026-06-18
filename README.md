<div align="center">

<img width="100%" src="img/banner.svg" />

<br/>

   <img src="https://img.shields.io/badge/PHP-8.3-777BB4?style=for-the-badge&logo=php&logoColor=white" />
   <img src="https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
   <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
   <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
   <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
   <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
   <img src="https://img.shields.io/badge/Nginx-Latest-009639?style=for-the-badge&logo=nginx&logoColor=white" />
   <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
   <img src="https://img.shields.io/badge/Socket.io-Latest-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />

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

### Seller
- **Store Management**
  Register as a seller, and manage store profile including name, logo, and description.
- **Product Management**
  Full CRUD for products within the store, including image upload and category tagging.
- **Order Management**
  View incoming orders and approve or reject them from the seller dashboard.
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

---

## Tech Stack

| Layer | Technology |
|:---|:---|
| Backend (PHP) | PHP 8.3-FPM, custom MVC, no framework |
| Backend (Node) | Node.js, Express.js, Socket.io, TypeScript |
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Database | PostgreSQL 16 Alpine |
| Real-time | Socket.io (WebSocket) |
| Payment | Midtrans SDK |
| Web Server | Nginx (reverse proxy + static files) |
| Containerization | Docker, Docker Compose |
| Process Manager | Supervisor |
| Base Image | Alpine Linux |

---

## Screenshots

### Milestone 1

#### Buyer

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

#### Seller

<div align="center">

| Seller Dashboard | Product Create |
|:---:|:---:|
| ![Seller Dashboard](img/seller_dashboard_page.png) | ![Product Create](img/create_product_page.png) |

| Product Management | Order Management |
|:---:|:---:|
| ![Product Management](img/product_management_page.png) | ![Order Management](img/order_management_page.png) |

| Store Update | |
|:---:|:---:|
| ![Store Update](img/update_store_page.png) | |

</div>

#### Auth

<div align="center">

| Login | Register |
|:---:|:---:|
| ![Login](img/login_page.png) | ![Register](img/register_page.png) |

| Profile | |
|:---:|:---:|
| ![Profile](img/profile_page.png) | |

</div>

### Milestone 2

#### Admin Panel

<div align="center">

| Admin Login | Admin Dashboard |
|:---:|:---:|
| ![Admin Login](img/m2/admin_login.png) | ![Admin Dashboard](img/m2/admin_dashboard.png) |

| User Management | Review Management |
|:---:|:---:|
| ![User Management](img/m2/user_management.png) | ![Review Management](img/m2/review_management.png) |

| Review Seller | |
|:---:|:---:|
| ![Review Seller](img/m2/review_seller.png) | |

</div>

#### Real-Time Chat

<div align="center">

| Chat Room | |
|:---:|:---:|
| ![Chat Room](img/m2/chat_room.png) | |

</div>

#### Live Auctions

<div align="center">

| Auction Detail | |
|:---:|:---:|
| ![Auction Detail](img/m2/auction_detail.png) | |

</div>

#### Payment Integration

<div align="center">

| Midtrans Checkout | |
|:---:|:---:|
| ![Midtrans Checkout](img/m2/midtrans_checkout.png) | |

</div>

---

## Google Lighthouse

### Milestone 1

#### Buyer

<div align="center">

| Product Discovery | Product Details |
|:---:|:---:|
| ![Product Discovery](img/lighthouse/product_discovery_page.png) | ![Product Details](img/lighthouse/product_details_page.png) |

| Cart | Checkout |
|:---:|:---:|
| ![Cart](img/lighthouse/cart_page.png) | ![Checkout](img/lighthouse/checkout_page.png) |

| Order History | Store Details |
|:---:|:---:|
| ![Order History](img/lighthouse/order_history_page.png) | ![Store Details](img/lighthouse/store_details_page.png) |

</div>

#### Seller

<div align="center">

| Seller Dashboard | Product Create |
|:---:|:---:|
| ![Seller Dashboard](img/lighthouse/seller_dashboard_page.png) | ![Product Create](img/lighthouse/create_product_page.png) |

| Product Management | Order Management |
|:---:|:---:|
| ![Product Management](img/lighthouse/product_management_page.png) | ![Order Management](img/lighthouse/order_management_page.png) |

</div>

#### Auth

<div align="center">

| Login | Register |
|:---:|:---:|
| ![Login](img/lighthouse/login_page.png) | ![Register](img/lighthouse/register_page.png) |

| Profile | |
|:---:|:---:|
| ![Profile](img/lighthouse/profile_page.png) | |

</div>

### Milestone 2

<div align="center">

| Admin Login | Admin Dashboard |
|:---:|:---:|
| ![Admin Login](img/m2/lighthouse/admin_login.png) | ![Admin Dashboard](img/m2/lighthouse/admin_dashboard.png) |

| User Management | Review Management |
|:---:|:---:|
| ![User Management](img/m2/lighthouse/user_management.png) | ![Review Management](img/m2/lighthouse/review_management.png) |

| Chat Room | Auction Detail |
|:---:|:---:|
| ![Chat Room](img/m2/lighthouse/chat_room.png) | ![Auction Detail](img/m2/lighthouse/auction_detail.png) |

| Midtrans Checkout | |
|:---:|:---:|
| ![Midtrans Checkout](img/m2/lighthouse/midtrans_checkout.png) | |

</div>

---

## Setup and Run

> **Prerequisites:** Docker, Docker Compose, ports 8080 and 5433 available on the host machine.

### Clone the repository

```bash
git clone https://github.com/brii26/nimonspedia
cd nimonspedia
```

### Start with Docker

```bash
docker-compose up --build -d
```

### Verify

```bash
curl http://localhost:8080
```

### Access

| Service | URL |
|:---|:---|
| Web Application | http://localhost:8080 |
| Database | localhost:5433 (PostgreSQL) |

---

## Project Structure

```
nimonspedia/
├── database/
│   └── init.sql
├── frontend/                  # React 18 + Vite SPA (Milestone 2)
│   └── src/
├── public/                    # PHP public entry + static assets
│   ├── assets/
│   ├── css/
│   └── js/
├── src/                       # PHP MVC core
│   └── app/
│       ├── controllers/
│       ├── services/
│       ├── repository/
│       └── views/
├── storage/                   # Uploaded product images and store logos
├── docker-compose.yml
├── Dockerfile
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

### Milestone 1 Roles

| Server-Side Feature | Author |
|:---|:---:|
| Docker Config | 149 |
| DB Connection | 149 |
| Core Logic | 149 |
| Login / Register / Logout | 149 |
| Update Profile | 149 |
| Create and Update Store | 126 |
| Product Discovery | 135 |
| Search and Filter | 149 |
| Product Detail Logic | 135 |
| Store Detail Logic | 126 |
| Top-up | 149 |
| Cart Logic | 135 |
| Checkout | 135 |
| Order History | 135 |
| Confirm Order | 135 |
| Seller Dashboard Logic | 126 |
| Product Management | 126 |
| Order Management | 126 |
| Export CSV | 149 |

| Client-Side Feature | Author |
|:---|:---:|
| Core Layout | 149 |
| Global Components | 149 |
| Register / Login / Profile Pages | 149 |
| Product Discovery Page | 135 |
| Product Detail Page | 135 |
| Store Detail Page | 135 |
| Cart Page | 135 |
| Checkout Page | 135 |
| Order History Page | 135 |
| Balance Management | 149 |
| Seller Dashboard Page | 126 |
| Store Management Page | 126 |
| Product Management Page | 126 |
| Order Management Page | 126 |

### Milestone 2 Roles

| Server-Side Feature | Author |
|:---|:---:|
| Node.js Server Setup | 149 |
| Socket.io Infrastructure | 149 |
| Admin Authentication Logic | 149 |
| Admin Dashboard API | 149 |
| User Management API | 149 |
| Review Management API | 135 |
| Feature Flags System | 149 |
| Chat Socket Events | 135 |
| Chat Message Handling | 135 |
| Auction Socket Events | 126 |
| Auction Bid Processing | 126 |
| Midtrans Server Integration | 149 |
| Payment Verification Logic | 149 |
| WebSocket Authentication | 135 |
| Database Migrations (M2) | ALL |

| Client-Side Feature | Author |
|:---|:---:|
| React Project Setup | 149 |
| Vite Configuration | 149 |
| TypeScript Migration | ALL |
| Admin Login Page | 149 |
| Admin Dashboard UI | 149 |
| User Management UI | 149 |
| Review Management UI | 149 |
| Chat Page UI | 135 |
| Chat Sidebar Component | 135 |
| Chat Socket Client | 135 |
| Auction List Page | 126 |
| Auction Detail Page | 126 |
| Live Bidding UI | 126 |
| Midtrans Checkout UI | 149 |
| Payment Status Pages | 149 |
| PWA Configuration | 149 |
| Service Worker Setup | 149 |
| Tailwind CSS Setup | 149 |

---

## Bonuses

- [x] Responsive Web Design (all pages)
- [x] UI/UX inspired by Tokopedia
- [x] Data Export (Excel/CSV)
- [x] Advanced Search
- [x] Google Lighthouse
- [x] Progressive Web App (PWA)
- [x] Live Chat (Socket.io)
- [x] Live Auctions (Socket.io)
- [x] Midtrans Payment Integration

---

<div align="center">
   <img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=120&color=0:217a28,100:42b549&section=footer" />
</div>
