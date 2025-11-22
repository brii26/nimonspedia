# Analisis Perubahan Kode & Konsep API - Milestone 2

Dokumen ini menjawab tiga pertanyaan fundamental terkait transisi dari Milestone 1 (M1) ke Milestone 2 (M2), serta menjelaskan peran vital API dalam arsitektur hybrid yang baru.

## 1. Apakah ada kode M1 yang perlu diubah?

**Jawabannya: YA, cukup banyak.**

Meskipun logika bisnis inti (CRUD Produk, Cart) tetap digunakan, cara penyajian dan infrastrukturnya mengalami perubahan signifikan untuk mengakomodasi React dan Node.js.

Berikut adalah tabel rincian perubahan yang harus dilakukan:

| Fitur / Komponen | Milestone 1 (Legacy) | Milestone 2 (Hybrid) | Keterangan |
|------------------|----------------------|----------------------|------------|
| Arsitektur Utama | Monolithic (PHP MVC) | Hybrid (PHP + Node.js + React) | Nginx bertindak sebagai Reverse Proxy untuk membagi trafik. |
| Frontend | HTML/CSS/JS Murni (Server-Side Rendering) | PHP Views (Legacy) + React SPA (Fitur Baru) | Halaman Chat, Lelang, dan Admin Dashboard wajib menggunakan React. |
| Backend Server | PHP 8.3 FPM | PHP 8.3 FPM + Node.js (Express) | Node.js menangani fitur Real-time, Admin API, dan Background Jobs. |
| Database Schema | Tabel User, Product, Store, Order | Schema M1 + Tabel Baru | Tambahan tabel: auctions, bids, chats, notifications, admin_flags. |
| Session Storage | File System (/var/lib/php/sessions) | Redis / Database Shared Session | Wajib diubah agar Node.js bisa membaca session login dari PHP. |
| Autentikasi User | PHP Session | PHP Session (Shared) | User login di PHP, tapi dikenali saat connect WebSocket ke Node.js. |
| Autentikasi Admin | - | JWT (JSON Web Token) | Admin login terpisah di React, token divalidasi oleh Node.js. |
| Komunikasi Data | HTTP Request (Synchronous) | HTTP + WebSocket (Socket.io) | WebSocket digunakan untuk Chatting dan Bidding Real-time. |
| Notifikasi | - | Web Push (Service Worker) | Notifikasi muncul di browser/OS meskipun tab tertutup. |
| Deployment | Docker (App + DB) | Docker (App + DB + Node + Redis) | docker-compose.yml perlu update signifikan. |

### A. Perubahan Infrastruktur (Critical)

Kode infrastruktur M1 harus dirombak total agar Node.js dan React bisa berjalan.

- **database/init.sql**: Wajib diubah. Anda harus menambahkan tabel baru sesuai spesifikasi M2 (auctions, auction_bids, chat_room, chat_messages, push_subscriptions, user_feature_access). Tanpa ini, fitur baru tidak memiliki tempat penyimpanan.
- **docker-compose.yml**: Wajib diubah. Anda perlu menambahkan service node (untuk backend baru) dan service redis (untuk penyimpanan session). Pastikan service db (PostgreSQL) bisa diakses oleh container Node.js dan PHP.
- **nginx.conf**: Wajib diubah. Nginx sekarang harus bertindak sebagai Reverse Proxy yang cerdas.
  - Permintaan ke `/` (root) dan halaman lama -> diarahkan ke container PHP.
  - Permintaan ke `/api/node` -> diarahkan ke container Node.js.
  - Permintaan ke `/socket.io` -> diarahkan ke container Node.js (dengan header WebSocket).
  - Permintaan aset statis React -> disajikan langsung oleh Nginx.

### B. Perubahan Kode PHP (Legacy)

PHP tidak bisa lagi hanya merender HTML (`View::render`). Ia harus mulai melayani data mentah (JSON) untuk dikonsumsi oleh React.

#### Controller Menjadi API Provider

- Saat ini, controller (misal `ProductController`) mengembalikan `View::render(...)` yang berisi HTML penuh.
- **Perubahan**: Controller harus dimodifikasi untuk mendeteksi apakah permintaan datang dari React (misal via header `Accept: application/json`) atau browser biasa. Jika dari React, controller harus mengembalikan JSON (`echo json_encode($data)`), bukan HTML.

#### Integrasi Tombol Baru di View Lama

- Halaman Product Detail (PHP) perlu ditambahkan tombol "Chat Penjual". Tombol ini bukan link biasa, tapi akan mengarahkan user ke aplikasi React (`/chat?store_id=...`).
- Halaman Product Management (Seller) perlu tombol "Mulai Lelang" yang mungkin memicu form baru atau mengarah ke React.

#### Session Sharing (Menggunakan Redis)

Agar user yang login di PHP (M1) dikenali di Node.js (M2) tanpa login ulang, kita akan menggunakan Redis sebagai session store terpusat.

- **Perubahan Kode**: Konfigurasi `php.ini` atau skrip inisialisasi session di PHP harus diubah agar menyimpan session ke server Redis (bukan file lokal). Node.js kemudian akan membaca session dari Redis yang sama untuk memvalidasi pengguna.

## 2. Apakah Auth perlu diubah menjadi Middleware?

**Jawabannya: YA, terutama di sisi Node.js.**

Di M1 (PHP), Anda mungkin menggunakan pendekatan prosedural seperti memanggil fungsi `Auth::requireAuth()` di baris pertama setiap method controller. Di M2, konsep Middleware menjadi sangat krusial karena arsitektur menjadi lebih kompleks.

### Mengapa Middleware?

Middleware adalah "penjaga pintu" yang berdiri di antara request masuk dan logic utama.

### A. Middleware di Node.js (Express.js) - WAJIB

Node.js akan menangani request dari dua jenis pengguna yang berbeda dengan metode autentikasi berbeda. Tanpa middleware, kode akan sangat berantakan (banyak if-else).

#### Middleware Admin (JWT Strategy)

- Admin login menggunakan React -> mendapat token JWT.
- Setiap admin melakukan aksi (misal: ban user), request dikirim dengan header `Authorization: Bearer <token>`.
- Anda wajib membuat middleware `verifyAdminToken` yang mengecek validitas token tersebut sebelum request diteruskan ke controller admin.

#### Middleware User Biasa (Session Sharing Strategy)

- Buyer/Seller sudah punya cookie `PHPSESSID` dari login PHP.
- Saat mereka connect ke WebSocket (Chat/Lelang), browser mengirim cookie tersebut.
- Anda wajib membuat middleware `verifyPhpSession` di Node.js yang membaca cookie tersebut, mengecek ke Redis (session PHP), dan menentukan apakah user valid atau tidak.

### B. Middleware di PHP - OPSIONAL

Di PHP M1, Anda sudah melakukan pengecekan di `BaseController` atau helper `Auth`. Ini secara teknis sudah berfungsi seperti middleware. Anda tidak wajib mengubah struktur PHP menjadi pipeline middleware ala Laravel jika tidak ingin, asalkan fungsi `requireAuth()` tetap konsisten menjaga endpoint API yang akan diakses React.

## 3. Penjelasan API dan Penggunaannya dalam M2

API (Application Programming Interface) adalah kontrak atau jembatan yang memungkinkan dua aplikasi berbeda (dalam kasus ini: Frontend React dan Backend PHP/Node) untuk saling berbicara dan bertukar data.

Bayangkan API sebagai pelayan restoran. React adalah pelanggan (hanya melihat menu), Backend adalah koki (memasak data). React tidak boleh masuk dapur (database) sendiri; ia harus memesan lewat pelayan (API).

### Bagaimana API Dipakai di Milestone 2?

Di M1, PHP melakukan semuanya: ambil data dari DB, lalu "menempelkannya" ke HTML, lalu kirim HTML jadi ke browser (Server Side Rendering).

Di M2, React adalah aplikasi kosong (Single Page Application). Saat dibuka, isinya hanya kerangka. React membutuhkan data untuk diisi ke kerangka tersebut. Di sinilah API bekerja:

#### Skenario 1: Mengambil Data Produk (PHP API)

- User membuka halaman "List Lelang" di React.
- React (Client) mengirim HTTP Request (AJAX/Fetch) ke URL: `GET /api/php/products`.
- Nginx meneruskan request ke container PHP.
- PHP menjalankan query SQL `SELECT * FROM products`, lalu mengubah hasilnya menjadi JSON:

```json
[
  {"id": 1, "name": "Pisang", "price": 5000},
  {"id": 2, "name": "Roket", "price": 99999}
]
```

- React menerima JSON tersebut, melakukan looping (`.map`), dan membuat kartu produk di layar browser.

#### Skenario 2: Login Admin (Node.js API)

- Admin mengisi form login di Dashboard Admin (React).
- React mengirim data: `POST /api/node/admin/login` dengan body `{email: "admin@nimons", pass: "rahasia"}`.
- Node.js mengecek database. Jika cocok, Node.js membuat token JWT.
- Node.js membalas dengan JSON: `{"token": "eyJhbGci..."}`.
- React menyimpan token itu untuk request selanjutnya.

#### Skenario 3: Real-time Chat (WebSocket API)

Ini adalah bentuk API khusus yang persistent (terus nyambung).

- React melakukan handshake ke server Node.js via socket.io.
- **API Event**: Saat user mengetik pesan, React mengirim event `emit('send_message', data)`.
- Server menerima, menyimpan ke DB, lalu melakukan `broadcast('new_message', data)` ke lawan bicara.
- React lawan bicara menerima event tersebut dan memunculkan bubble chat baru tanpa refresh halaman.

**Kesimpulan**: API di M2 adalah "bahasa" yang digunakan React untuk meminta data dari PHP (legacy data) dan Node.js (new features). Tanpa API yang mengembalikan JSON, React tidak akan bisa menampilkan data apa-apa.