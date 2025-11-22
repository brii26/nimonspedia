# Penjelasan Mendalam: Peran Komponen Tech Stack Nimonspedia M2

## 1. Infrastruktur & Gerbang Utama

### Docker & Docker Compose

**Peran**: Wadah isolasi dan orkestrator.

**Tugas Konkret**:

- Membungkus PHP, Node.js, Nginx, dan PostgreSQL dalam container terpisah agar tidak terjadi konflik versi dengan software di laptop masing-masing anggota tim.
- Menjalankan semua service (PHP, Node, DB, Nginx) secara bersamaan hanya dengan satu perintah `docker-compose up`.
- Membuat jaringan internal (bridge network) agar container PHP bisa memanggil container DB menggunakan nama host `db` tanpa perlu tahu IP address-nya.

### Nginx (Reverse Proxy)

**Peran**: Polisi lalu lintas / Resepsionis.

**Tugas Konkret**:

- Menerima semua request dari browser (port 8080).
- Mengecek URL request:
  - Jika URL diawali `/api/node` atau request WebSocket (`/socket.io`), teruskan ke container Node.js.
  - Jika URL meminta file statis React (`/assets`, `/admin`, `/chat`), sajikan langsung file tersebut dari folder build.
  - Jika URL lainnya (`/login`, `/register`, `/cart`), teruskan ke container PHP.
- Menangani header khusus untuk WebSocket (Upgrade header) agar koneksi tidak terputus.

## 2. Backend: The Dual-Core Engine

### PHP 8.3 (Legacy Core)

**Peran**: Pengelola logika bisnis utama (toko, produk, order) dan autentikasi dasar.

**Tugas Konkret**:

- Menangani login/register untuk Buyer dan Seller.
- Membuat session ID (`PHPSESSID`) dan menyimpannya di cookie browser.
- Menangani CRUD Produk, Toko, dan Cart (logika yang sudah ada dari M1).
- Merender halaman HTML tradisional (Server-Side Rendering) untuk fitur-fitur M1.

### Node.js + Express (Real-time Core)

**Peran**: Pengelola fitur interaktif, admin, dan komunikasi real-time.

**Tugas Konkret**:

- **WebSocket Server**: Menjalankan server socket.io untuk fitur Chat dan Lelang.
- **Admin API**: Menyediakan endpoint login dan manajemen data khusus untuk Admin (karena Admin butuh JWT, bukan Session PHP).
- **Job Scheduler**: Menghitung mundur waktu lelang dan secara otomatis menutup lelang (membuat order) ketika waktu habis, tanpa perlu user me-refresh halaman.
- **Push Notification Trigger**: Mengirim sinyal ke browser user (melalui Service Worker) ketika ada pesan baru atau status lelang berubah.

## 3. Frontend: The Modern Interface

### React.js + Vite

**Peran**: Antarmuka pengguna (UI) yang dinamis dan interaktif.

**Tugas Konkret**:

- **Single Page Application (SPA)**: Menangani halaman Chat, Lelang, dan Admin Dashboard agar perpindahan halaman terasa instan (tanpa loading putih).
- **State Management**: Menyimpan data sementara di memori browser (misal: daftar pesan chat yang baru diterima, timer lelang yang berjalan mundur) menggunakan `useState`.
- **Socket Listener**: Mendengarkan "siaran" dari Node.js (misal: "Ada bid baru masuk!") dan langsung mengupdate tampilan harga tanpa user perlu reload.

### Tailwind CSS

**Peran**: Penata gaya (styling) yang cepat.

**Tugas Konkret**:

- Memberikan style pada komponen React langsung di dalam file JSX (contoh: `<div className="bg-blue-500 text-white p-4">`).
- Menangani responsivitas (tampilan HP vs Laptop) dengan prefix mudah (misal: `md:flex` artinya "hanya jadi flexbox di layar medium ke atas").

### Service Worker (Web API)

**Peran**: Pekerja latar belakang (Background Worker) di browser.

**Tugas Konkret**:

- Menerima Push Notification dari server Node.js bahkan ketika tab website Nimonspedia sedang ditutup.
- Memunculkan pop-up notifikasi sistem di pojok layar device user.

## 4. Data & Keamanan

### PostgreSQL

**Peran**: Gudang data tunggal (Single Source of Truth).

**Tugas Konkret**:

- Menyimpan semua data: User, Produk, Chat, Lelang, dll.
- Diakses oleh PHP (untuk fitur M1) dan Node.js (untuk fitur M2) secara bergantian.
- Menjamin konsistensi data transaksi (misal: mengurangi saldo pembeli dan menahan stok barang dalam satu transaksi atomik).

### JWT (JSON Web Token)

**Peran**: Kartu identitas digital untuk Admin.

**Tugas Konkret**:

- Saat Admin login di React, Node.js memberikan token JWT.
- React menyimpan token ini di localStorage.
- Setiap Admin mau menghapus user atau mengubah flag fitur, React mengirim token ini. Node.js memvalidasi token untuk memastikan yang request benar-benar Admin sah.

### Session Sharing (Cookie)

**Peran**: Jembatan autentikasi antara PHP dan Node.js.

**Tugas Konkret**:

- PHP membuat cookie sesi saat user login.
- Saat React (di browser) menghubungi Node.js lewat WebSocket, cookie ini otomatis terbawa.
- Node.js membaca ID sesi dari cookie tersebut dan mengecek ke database/redis: "Apakah ID sesi ini milik user yang valid?". Ini mencegah user nakal mengakses fitur chat tanpa login PHP.

## 5. Alur Kerja Gabungan (Contoh Kasus: Lelang)

- **Seller (PHP)**: Seller membuat lelang baru di halaman PHP. Data masuk ke PostgreSQL.
- **Buyer (React)**: Buyer membuka halaman "Daftar Lelang" (React).
  - **Request**: React meminta data lelang aktif ke Node.js (`GET /api/node/auctions`).
  - **Respon**: Node.js query ke PostgreSQL, lalu kirim data JSON ke React.
  - **Connect**: React terhubung ke WebSocket Node.js dan masuk ke "Room Lelang".
  - **Action**: Buyer menekan tombol "Bid". React mengirim event `place_bid` ke Node.js via Socket.
  - **Proses**: Node.js memvalidasi saldo buyer (query DB), update harga di DB, dan potong saldo.
  - **Broadcast**: Node.js berteriak ke semua orang di "Room Lelang": "Harga naik jadi X rupiah!".
  - **Update**: Layar semua buyer yang sedang melihat lelang tersebut otomatis berubah harganya dalam milidetik.