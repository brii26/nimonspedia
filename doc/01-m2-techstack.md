# Dokumen Arsitektur & Tech Stack - Milestone 2

Dokumen ini merincikan arsitektur sistem "Hybrid" dan teknologi yang akan digunakan untuk menyelesaikan Milestone 2 Nimonspedia. Pilihan teknologi didasarkan pada spesifikasi tugas dan kemudahan integrasi.

## 1. Diagram Arsitektur High-Level

Sistem akan berjalan di atas Docker menggunakan Nginx sebagai pintu gerbang utama (Reverse Proxy).

## 2. Rincian Tech Stack

### A. Client-Side (Frontend Baru)

Digunakan untuk fitur interaktif: Chat, Lelang (Auction), dan Admin Dashboard.

| Komponen     | Teknologi       | Alasan Pemilihan |
|--------------|-----------------|------------------|
| Framework    | React.js        | Wajib di spek. Menggunakan pendekatan SPA (Single Page Application). |
| Build Tool   | Vite            | Jauh lebih cepat dan ringan dibanding Create React App. Konfigurasi sangat minimal. |
| Styling      | Tailwind CSS    | Mempercepat styling tanpa perlu file CSS terpisah yang membingungkan. Responsive design mudah diterapkan. |
| Routing      | React Router DOM| Standar industri untuk navigasi di dalam React SPA (misal: pindah dari list lelang ke detail lelang). |
| HTTP Client  | Axios           | Syntax lebih bersih dibanding fetch bawaan, penanganan error lebih konsisten. |
| Real-time    | Socket.io-client| Library wajib untuk terhubung dengan WebSocket server (Chat & Lelang). |
| Icons        | Lucide React    | Konsisten dengan desain modern, mudah diintegrasikan sebagai komponen. |

### B. Server-Side 1 (Real-time & Logic Baru)

Digunakan untuk menangani WebSocket, Admin Auth, dan Background Job.

| Komponen       | Teknologi       | Alasan Pemilihan |
|----------------|-----------------|------------------|
| Runtime        | Node.js (LTS)   | Wajib di spek. Menangani concurrency tinggi untuk fitur real-time. |
| Framework      | Fastify.js      | Blazing fast buat node. |
| WebSocket      | Socket.io       | Menangani room, broadcasting, dan auto-reconnect jauh lebih mudah daripada WebSocket murni (ws). |
| Database Driver| pg (node-postgres)| Driver standar untuk koneksi Node.js ke PostgreSQL. Ringan dan straightforward. |
| Authentication | JSON Web Token (JWT)| Standar wajib untuk login Admin (Stateless). |
| Notifications  | web-push        | Library standar untuk mengirim Push Notification ke browser (VAPID). |
| Security       | bcryptjs        | Untuk hashing password (jika diperlukan verifikasi manual) dan sanitasi input. |

### C. Server-Side 2 (Legacy & Main Logic)

Menggunakan kode Milestone 1 yang sudah ada dengan sedikit modifikasi.

| Komponen | Teknologi | Alasan Pemilihan |
|----------|-----------|------------------|
| Bahasa   | PHP 8.3   | Sesuai base image M1. Menangani Auth Buyer/Seller dan CRUD dasar. |
| Framework| Pure PHP  | Melanjutkan arsitektur MVC buatan sendiri dari M1 (tanpa Laravel/CI). |
| Driver DB| PDO       | Sudah terimplementasi di M1. |

### D. Database & Storage

Penyimpanan data terpusat.

| Komponen | Teknologi     | Alasan Pemilihan |
|----------|---------------|------------------|
| Database | PostgreSQL 16 | Wajib di spek. Shared database antara PHP dan Node.js. |
| Storage  | Local Filesystem| Gambar produk disimpan di folder /storage yang di-mount agar bisa diakses PHP dan Nginx. |

### E. Infrastructure

Lingkungan pengembangan dan deployment.

| Komponen     | Teknologi     | Alasan Pemilihan |
|--------------|---------------|------------------|
| Orchestration| Docker Compose| Menjalankan PHP, Node, Nginx, dan DB secara bersamaan dengan satu perintah. |
| Web Server   | Nginx         | Berperan sebagai Reverse Proxy. Tugas utamanya memilah request: request halaman biasa ke PHP, request API/Socket ke Node.js. |

## 3. Strategi Integrasi (How it works)

### 1. Routing (Nginx)

Nginx akan menjadi "Polisi Lalu Lintas".

- Request ke `/api/node/...` -> Diteruskan ke container Node.js.
- Request ke `/socket.io/...` -> Diteruskan ke container Node.js (Upgrade header).
- Request ke `/admin`, `/chat`, `/auction` -> Nginx menyajikan file HTML/JS React.
- Request lainnya (`/`, `/login`, `/cart`) -> Diteruskan ke container PHP.

### 2. Autentikasi Buyer/Seller (Session Sharing)

- **Login**: Dilakukan di PHP. PHP membuat cookie `PHPSESSID`.
- **WebSocket Connect**: React mengirim cookie `PHPSESSID` saat handshake ke Node.js.
- **Verifikasi**: Node.js mengambil ID session dari cookie, lalu melakukan query ke Database/Redis (tergantung implementasi session PHP) untuk memastikan user valid.
- **Saran**: Untuk kemudahan, simpan session di Database atau Redis agar Node.js mudah membacanya. Jika menggunakan file session default PHP, kita perlu mount volume folder session PHP ke container Node.js.

### 3. Autentikasi Admin (JWT)

- **Login**: React Admin mengirim email/pass ke endpoint Node.js `/api/node/admin/login`.
- **Token**: Node.js memvalidasi dan membalas dengan JWT.
- **Storage**: React menyimpan JWT di localStorage.
- **Request**: Setiap request admin berikutnya menyertakan header `Authorization: Bearer <token>`.

### 4. Data Sinkronisasi

PHP dan Node.js menggunakan database yang SAMA (PostgreSQL).  
Jika Seller membuat lelang di PHP, data masuk ke tabel `auctions`. Node.js langsung bisa membaca data tersebut untuk ditampilkan di React.

## 4. Langkah Selanjutnya untuk Tim

- **Anggota 1**: Install npm dan vite lokal. Update `docker-compose.yml` untuk memasukkan service node.
- **Anggota 2 & 3**: Pelajari dasar React Hooks (`useState`, `useEffect`) dan Socket.io events (`emit`, `on`).