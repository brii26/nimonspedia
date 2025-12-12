# Nimonspedia - E-commerce Platform

<p align="center">
  <img src="public/assets/images/logo.png" alt="Nimonspedia Logo" width="200"/>
</p>

<p align="center">
  Nimonspedia is a full-featured e-commerce platform built from scratch in pure PHP. It provides a complete marketplace experience: Buyers can browse, search, and filter products, manage a shopping cart, and purchase items using an internal balance. Sellers can register their own stores, manage their product inventory (full CRUD), and fulfill incoming orders.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PHP-8.3-blue" alt="PHP 8.3">
  <img src="https://img.shields.io/badge/Database-PostgreSQL_16-blue" alt="PostgreSQL 16">
  <img src="https://img.shields.io/badge/Web_Server-Nginx-green" alt="Nginx">
  <img src="https://img.shields.io/badge/Container-Docker-blue" alt="Docker">
  <img src="https://img.shields.io/badge/Base_Image-Alpine_Linux-darkblue" alt="Alpine Linux">
</p>

---

## Table of Contents

* [Key Features](#key-features)
  * [Buyer Features](#buyer-features)
  * [Seller Features](#seller-features)
* [Screenshots](#screenshots)
* [Technology Stack](#technology-stack)
* [Quick Start](#quick-start)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
  * [Access Points](#access-points)
* [System Architecture](#system-architecture)
* [Project Structure](#project-structure)
* [Author](#author)
  * [Roles and Responsibilities](#roles-and-responsibilities)
* [Bonuses](#bonuses)
  * [Google Lighthouse](#google-lighthouse)
---

## Key Features

### Buyer Features
* **Authentication & Profile**: User registration, login, logout, and profile management.
* **Balance Management**: View and top-up account balance.
* **Product Discovery**: Browse all products, search by name, and filter by category or price.
* **Product & Store Details**: View detailed product information (description, stock, store) and visit store-specific pages.
* **Shopping Cart**: Add, update, and remove items from the shopping cart.
* **Checkout**: Place orders from the cart, which validates and deducts balance and stock.
* **Order History**: View past orders, confirm order reception, and manage order status.
* **Advanced Search**: Product Search will return all relevant items 

### Seller Features
* **Store Authentication**: Register as a seller and manage store profile (name, logo, description).
* **Product Management**: Full CRUD (Create, Read, Update, Delete) for products within the seller's store.
* **Order Management**: View and manage incoming orders, with the ability to approve or reject them.
* **Data Export**: Export performance list to Excel/CSV

## Screenshots

### Buyer

| Product Discovery | Product Details |
| :---: | :---: |
| ![Product Discovery](img/product_discovery_page.png) | ![Product Details](img/product_details_page.png) |

| Cart | Checkout |
| :---: | :---: |
| ![Cart](img/cart_page.png) | ![Checkout](img/checkout_page.png) |

| Order History | Store Details |
| :---: | :---: |
| ![Order History](img/order_history_page.png) | ![Store Details](img/store_details_page.png) |

### Seller

| Seller Dashboard | Product Create |
| :---: | :---: |
| ![Seller Dashboard](img/seller_dashboard_page.png) | ![Product Create](img/create_product_page.png) |

| Product Management | Order Management |
| :---: | :---: |
| ![Product Management](img/product_management_page.png) | ![Order Management](img/order_management_page.png) |

| Store Update |
| :---: |
| ![Store Update](img/update_store_page.png) |

### Auth

| Login | Register |
| :---: | :---: |
| ![Login](img/login_page.png) | ![Register](img/register_page.png) |

| Profile |
| :---: |
| ![Profile](img/profile_page.png) |


## Technology Stack

* **Backend**: PHP 8.3-FPM (Pure, no frameworks)
* **Frontend**: HTML, CSS, JavaScript (Pure, no frameworks)
* **Web Server**: Nginx
* **Database**: PostgreSQL 16 Alpine
* **Containerization**: Docker & Docker Compose
* **Base Image**: Alpine Linux (for Nginx, PHP, and PostgreSQL)
* **Process Manager**: Supervisor (managing Nginx & PHP-FPM processes)

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Port 8080 and 5433 available on the host machine.

### Installation
```bash
# Clone repository
git clone <repository-url>
cd nimonspedia

# Build and start containers  
docker-compose up --build -d

# Verify installation
curl http://localhost:8080
```

### Access Points
- Web Application: http://localhost:8080
- Database: localhost:5433 (PostgreSQL)
- Development: Live reload via volume mounting

## System Architecture
This application employs a containerized microservices architecture with two primary services:
- Web Application Container (PHP + Nginx + Alpine Linux)
- Database Container (PostgreSQL 16 Alpine)

## Project Structure
### Project Structure
```
.
├── database/
│   └── init.sql
├── public/
│   ├── assets/
│   │   ├── icons/
│   │   │   ├── eye-off.svg
│   │   │   ├── eye.svg
│   │   │   └── search.svg
│   │   └── images/
│   │       └── logo.png
│   ├── css/
│   │   ├── components/
│   │   │   ├── modal.css
│   │   │   └── product-filter.css
│   │   ├── pages/
│   │   │   ├── seller/
│   │   │   │   ├── products/
│   │   │   │   │   ├── create.css
│   │   │   │   │   ├── edit.css
│   │   │   │   │   └── index.css
│   │   │   │   ├── orders.css
│   │   │   │   └── store.css
│   │   │   ├── auth.css
│   │   │   ├── cart.css
│   │   │   ├── checkout.css
│   │   │   ├── dashboard.css
│   │   │   ├── errors.css
│   │   │   ├── product-detail.css
│   │   │   ├── profile.css
│   │   │   └── store-detail.css
│   │   ├── components.css
│   │   └── global.css
│   ├── js/
│   │   ├── components/
│   │   │   ├── confirm-modal.js
│   │   │   ├── password-toggle.js
│   │   │   └── product-filter.js
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── login.js
│   │   │   │   ├── profile.js
│   │   │   │   └── register.js
│   │   │   ├── cart/
│   │   │   │   └── index.js
│   │   │   ├── dashboard/
│   │   │   │   ├── buyer.js
│   │   │   │   └── seller.js
│   │   │   ├── orders/
│   │   │   │   ├── checkout.js
│   │   │   │   └── index.js
│   │   │   ├── products/
│   │   │   │   ├── index.js
│   │   │   │   └── show.js
│   │   │   └── seller/
│   │   │       ├── products/
│   │   │       │   ├── create.js
│   │   │       │   ├── edit.js
│   │   │       │   └── index.js
│   │   │       └── orders.js
│   │   ├── utils/
│   │   │   ├── fetchXhr.js
│   │   │   └── quill-setup.js
│   │   └── app.js
│   ├── .htaccess
│   ├── favicon.ico
│   └── index.php
├── src/
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── BaseController.php
│   │   │   ├── BuyerOrdersController.php
│   │   │   ├── CartController.php
│   │   │   ├── HomeController.php
│   │   │   ├── ProductController.php
│   │   │   ├── ReportController.php
│   │   │   ├── SellerController.php
│   │   │   ├── SellerOrdersController.php
│   │   │   └── StoreController.php
│   │   ├── models
│   │   ├── repository/
│   │   │   ├── BaseRepository.php
│   │   │   ├── CartItemRepository.php
│   │   │   ├── CategoryRepository.php
│   │   │   ├── OrderRepository.php
│   │   │   ├── ProductRepository.php
│   │   │   ├── ReportRepository.php
│   │   │   ├── StoreRepository.php
│   │   │   └── UserRepository.php
│   │   ├── services/
│   │   │   ├── AuthService.php
│   │   │   ├── BuyerOrderaService.php
│   │   │   ├── CartService.php
│   │   │   ├── CategoryService.php
│   │   │   ├── FileService.php
│   │   │   ├── ProductService.php
│   │   │   ├── ReportService.php
│   │   │   ├── SanitizerService.php
│   │   │   ├── SellerOrderService.php
│   │   │   ├── StatsService.php
│   │   │   └── StoreService.php
│   │   └── views/
│   │       ├── components/
│   │       │   ├── cart-success-modal.php
│   │       │   ├── confirm-modal.php
│   │       │   ├── error-modal.php
│   │       │   ├── layout.php
│   │       │   ├── navbar.php
│   │       │   ├── order-list.php
│   │       │   ├── product-filter.php
│   │       │   ├── product-list.php
│   │       │   ├── seller-order-list.php
│   │       │   ├── seller-product-filter.php
│   │       │   └── seller-product-list.php
│   │       └── pages/
│   │           ├── auth/
│   │           │   ├── login.php
│   │           │   ├── profile.php
│   │           │   └── register.php
│   │           ├── cart/
│   │           │   └── index.php
│   │           ├── dashboard/
│   │           │   ├── buyer.php
│   │           │   └── seller.php
│   │           ├── errors/
│   │           │   └── 404.php
│   │           ├── orders/
│   │           │   ├── checkout.php
│   │           │   ├── index.php
│   │           │   ├── show.php
│   │           │   └── sucess.php
│   │           ├── products/
│   │           │   ├── index.php
│   │           │   └── show.php
│   │           ├── seller/
│   │           │   ├── orders/
│   │           │   │   └── index.php
│   │           │   └── products/
│   │           │       ├── create.php
│   │           │       ├── edit.php
│   │           │       └── index.php
│   │           └── stores/
│   │               └── detail.php
│   ├── config/
│   │   └── database.php
│   ├── core/
│   │   ├── Application.php
│   │   ├── Auth.php
│   │   ├── Database.php
│   │   ├── Router.php
│   │   └── View.php
│   └── lib
├── storage/
│   ├── product_images/
│   └── store_logos/
├── .dockerignore
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── php.ini
├── README.md
└── supervisord.conf
```

## Author
| Name                     | NIM      |
|--------------------------|----------|
| Brian Ricardo Tamin      | 13523126 |
| Ahmad Syafiq             | 13523135 |
| Naufarrel Zhafif Abhista | 13523149 | 

### Roles and Responsibilities
| Server-Side Feature   | Author              |
|-----------------------|---------------------|
| Docker Config         | 149                 |
| DB Connection         | 149         |
| Core Logic            | 149         |
| Login                 | 149         |
| Register              | 149         |
| Logout                | 149         |
| Update Profil         | 149         |
| Create & Update Store | 126         |
| Product Discovery     | 135         |
| Search n Filter Prod  | 149         |
| Prod Detail Logic     | 135         |
| Store Detail Logic    | 126         |
| Top-up                | 149         |
| Cart Logic            | 135         |
| Checkout              | 135         |
| Order History         | 135         |
| Confirm Order         | 135         |
| Seller Dashboard Logic| 126         |
| Product Management    | 126         |
| Order Management      | 126         |
| Export CSV            | 149         |

| Client-Side Feature   | Author              |
|-----------------------|---------------------|
| Core Layout           | 149         |
| Global Component      | 149         |
| Register Page         | 149         |
| Login Page            | 149         |
| Profile Page          | 149         |
| Prod Discovery Page   | 135         |
| Prod Detail Page      | 135         |
| Store Detail Page     | 135         |
| Cart Page             | 135         |
| Checkout Page         | 135         |
| Order History Page    | 135         |
| Balance Management    | 149         |
| Seller Dashboard Page | 126         |
| Store Management Page | 126         |
| Prod Management Page  | 126         |
| Order Management Page | 126         |

## Bonuses
- [x] All Responsive Web Design
- [x] UI/UX Seperti Tokopedia
- [x] Data Export
- [x] Advanced Search
- [x] Google Lighthouse

### Google Lighthouse

#### Buyer

| Product Discovery | Product Details |
| :---: | :---: |
| ![Product Discovery](img/lighthouse/product_discovery_page.png) | ![Product Details](img/lighthouse/product_details_page.png) |

| Cart | Checkout |
| :---: | :---: |
| ![Cart](img/lighthouse/cart_page.png) | ![Checkout](img/lighthouse/checkout_page.png) |

| Order History | Store Details |
| :---: | :---: |
| ![Order History](img/lighthouse/order_history_page.png) | ![Store Details](img/lighthouse/store_details_page.png) |

#### Seller

| Seller Dashboard | Product Create |
| :---: | :---: |
| ![Seller Dashboard](img/lighthouse/seller_dashboard_page.png) | ![Product Create](img/lighthouse/create_product_page.png) |

| Product Management | Order Management |
| :---: | :---: |
| ![Product Management](img/lighthouse/product_management_page.png) | ![Order Management](img/lighthouse/order_management_page.png) |

#### Auth

| Login | Register |
| :---: | :---: |
| ![Login](img/lighthouse/login_page.png) | ![Register](img/lighthouse/register_page.png) |

| Profile |
| :---: |
| ![Profile](img/lighthouse/profile_page.png) |

---

## Milestone 2 - New Features

### Admin Panel
* **Admin Authentication**: Secure login for administrators with role-based access control
* **Dashboard Overview**: View platform statistics, user counts, auction metrics, and reviews
* **User Management**: Browse, search, and manage users (buyers, sellers, admins)
* **Review Moderation**: View and manage product reviews across the platform
* **Feature Flags**: Control user access to specific features dynamically

### Real-Time Features
* **Live Chat**: Real-time messaging between buyers and sellers using WebSocket (Socket.io)
  * Product-specific chat rooms
  * Typing indicators
  * Message status (sent, delivered, read)
  * Auto-updating sidebar with unread counts
  * Product preview in chat interface
* **Live Auctions**: Real-time bidding system with WebSocket updates
  * Live bid updates for all participants
  * Countdown timer synchronization
  * Automatic auction status updates
  * Real-time bid history

### Payment Integration
* **Midtrans Integration**: Secure payment processing for balance top-ups
  * Multiple payment methods (Credit Card, GoPay, Bank Transfer, etc.)
  * Payment verification and status tracking
  * Automatic balance updates upon successful payment
  * Payment history with transaction details

### Enhanced User Experience
* **Progressive Web App (PWA)**: Install app on mobile/desktop with offline capabilities
* **Responsive Design**: Fully responsive UI built with React and Tailwind CSS
* **Type Safety**: Full TypeScript implementation for better code quality
* **Modern Stack**: Vite for fast development, React Router for navigation

## Milestone 2 Screenshots

### Admin Panel

| Admin Login | Admin Dashboard |
| :---: | :---: |
| ![Admin Login](img/m2/admin_login.png) | ![Admin Dashboard](img/m2/admin_dashboard.png) |

| User Management | Review Management |
| :---: | :---: |
| ![User Management](img/m2/user_management.png) | ![Review Management](img/m2/review_management.png) |
![Review Seller](img/m2/review_seller.png)


### Real-Time Chat

![Chat Room](img/m2/chat_room.png)

### Live Auctions
![Auction Detail](img/m2/auction_detail.png)
### Payment Integration

| Midtrans Checkout | 
| :---: |
| ![Midtrans Checkout](img/m2/midtrans_checkout.png) |

---

## Milestone 2 Google Lighthouse

### Admin Panel

| Admin Login | Admin Dashboard |
| :---: | :---: |
| ![Admin Login Lighthouse](img/m2/lighthouse/admin_login.png) | ![Admin Dashboard Lighthouse](img/m2/lighthouse/admin_dashboard.png) |

| User Management | Review Management |
| :---: | :---: |
| ![User Management Lighthouse](img/m2/lighthouse/user_management.png) | ![Review Management Lighthouse](img/m2/lighthouse/review_management.png) |

### Real-Time Chat

| Chat Room |
| :---: |
| ![Chat Room Lighthouse](img/m2/lighthouse/chat_room.png) |

### Live Auctions

| Auction Detail |
| :---: |
| ![Auction Detail Lighthouse](img/m2/lighthouse/auction_detail.png) |

### Payment Integration

| Midtrans Checkout |
| :---: |
| ![Midtrans Checkout Lighthouse](img/m2/lighthouse/midtrans_checkout.png) |

---

## Milestone 2 Technology Stack

### Backend
* **Node.js Server**: Express.js with TypeScript for WebSocket and API endpoints
* **Socket.io**: Real-time bidirectional communication for chat and auctions
* **Midtrans SDK**: Secure payment processing integration with multiple payment methods
* **PostgreSQL**: Database with advanced queries and transaction management

### Frontend
* **React 18**: Modern UI library with hooks and context API
* **TypeScript**: Type-safe development across the entire frontend
* **Tailwind CSS**: Utility-first CSS framework for responsive design
* **Vite**: Next-generation frontend tooling for fast builds
* **Socket.io Client**: Real-time client library for WebSocket connections

### DevOps
* **Docker Compose**: Multi-container orchestration for all services
* **Nginx**: Reverse proxy and static file serving
* **Supervisor**: Process management for multiple services

---

## Milestone 2 Roles and Responsibilities

| Server-Side Feature              | Author |
|----------------------------------|--------|
| Node.js Server Setup             | 149    |
| Socket.io Infrastructure         | 149    |
| Admin Authentication Logic       | 149    |
| Admin Dashboard API              | 149    |
| User Management API              | 149    |
| Review Management API            | 135    |
| Feature Flags System             | 149    |
| Chat Socket Events               | 135    |
| Chat Message Handling            | 135    |
| Auction Socket Events            | 126    |
| Auction Bid Processing           | 126    |
| Midtrans Server Integration      | 149    |
| Payment Verification Logic       | 149    |
| WebSocket Authentication         | 135    |
| Database Migrations (M2)         | ALL    |

| Client-Side Feature              | Author |
|----------------------------------|--------|
| React Project Setup              | 149    |
| Vite Configuration               | 149    |
| TypeScript Migration             | ALL    |
| Admin Login Page                 | 149    |
| Admin Dashboard UI               | 149    |
| User Management UI               | 149    |
| Review Management UI             | 149    |
| Chat Page UI                     | 135    |
| Chat Sidebar Component           | 135    |
| Chat Socket Client               | 135    |
| Auction List Page                | 126    |
| Auction Detail Page              | 126    |
| Live Bidding UI                  | 126    |
| Midtrans Checkout UI             | 149    |
| Payment Status Pages             | 149    |
| PWA Configuration                | 149    |
| Service Worker Setup             | 149    |
| Tailwind CSS Setup               | 149    |

---
