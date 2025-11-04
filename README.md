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

### Halaman Autentikasi & Profil

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
(insert screenshot)

