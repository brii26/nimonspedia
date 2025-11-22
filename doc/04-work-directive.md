# Arahan Kerja Kelompok - Milestone 2 Nimonspedia

Dokumen ini berisi pembagian tugas dan jadwal pengerjaan untuk Milestone 2.

**Target Selesai**: 6 Desember 2025

**Total Anggota**: 3 Orang

## Prinsip Utama

- **Fullstack Ownership**: Setiap orang memegang frontend (React) dan backend (Node/PHP) untuk fiturnya.
- **Single Source of Truth**: Arsitektur dan Database dipegang satu orang (Anggota 1) untuk mencegah konflik merge yang fatal.
- **Integrasi**: Docker adalah kunci. Pastikan container berjalan di laptop masing-masing sejak hari ke-2.

## 1. Pembagian Tugas (Roles)

### Anggota 1: System Architect & Admin

**Fokus**: Infrastruktur, Database, dan Modul Administrator.

#### Tugas Server-side (Node.js & Config):

- [ ] [CRITICAL] Setup docker-compose.yml (gabung PHP, Nginx, Node.js, Postgres).
- [ ] [CRITICAL] Update init.sql (tambah tabel auctions, chat, admin, dll).
- [ ] Konfigurasi Nginx Reverse Proxy (routing /api vs /).
- [ ] Middleware Auth: JWT untuk Admin & Session Verification (PHP Session) untuk WebSocket.
- [ ] REST API Admin: CRUD User, Flag Management.

#### Tugas Client-side (React):

- [ ] Setup inisial React (Vite + Tailwind/CSS).
- [ ] Halaman Admin Login.
- [ ] Halaman Admin Dashboard (User List & Feature Flags Toggle).

### Anggota 2: Auction Specialist

**Fokus**: Fitur Lelang, Real-time Bidding, dan Logika Transaksi Otomatis.

#### Tugas Server-side (Node.js & PHP):

- [ ] Node.js: WebSocket Server untuk Room Lelang (socket.io).
- [ ] Node.js: Logic place_bid, validasi saldo, dan timer server-side.
- [ ] Node.js: Job Scheduler untuk menutup lelang & buat Order otomatis saat waktu habis.
- [ ] PHP: Update SellerController agar Penjual bisa "Buat Lelang" dari produk.

#### Tugas Client-side (React):

- [ ] Halaman Auction List (Card lelang, filter status).
- [ ] Halaman Auction Detail (Countdown Timer, Live Bidding Log, Info Produk).
- [ ] Integrasi saldo real-time saat bidding.

### Anggota 3: Communication Specialist

**Fokus**: Fitur Chat, Notifikasi, dan Integrasi Legacy.

#### Tugas Server-side (Node.js & PHP):

- [ ] Node.js: WebSocket Server untuk Chat (private_message, typing).
- [ ] Node.js: Push Notification System (VAPID keys, subscription endpoint).
- [ ] PHP: Update Navbar (tambah menu baru) & Product Detail (tombol Chat).
- [ ] PHP: Halaman Profile (Setting preferensi notifikasi).

#### Tugas Client-side (React):

- [ ] Halaman Chat (Sidebar List User, Chat Room, Bubble Chat).
- [ ] Komponen Toast/Notifikasi popup.
- [ ] Service Worker untuk handle Push Notification di background.

## 2. Milestone Internal (Timeline)

### Minggu 1: Fondasi & Fitur Dasar (23 - 29 Nov)

#### Hari 1-2 (Setup):

- (A1) Docker & DB Schema siap. Repository di-update.
- (A2 & A3) Pull repo, pastikan Docker jalan lokal.

#### Hari 3-5 (Backend Core):

- (A1) API Admin & JWT selesai.
- (A2) WebSocket Bidding dasar jalan.
- (A3) WebSocket Chat dasar jalan.

#### Hari 6-7 (Frontend Basic):

- (A1) Dashboard Admin UI selesai.
- (A2) Halaman List Lelang tampil data dummy/API.
- (A3) Halaman Chat UI selesai (bisa kirim teks).

### Minggu 2: Integrasi & Real-time (30 Nov - 6 Des)

#### Hari 8-9 (Integration):

- Gabungkan PHP Session login dengan Node.js (memastikan user PHP bisa connect WebSocket Node).
- (A2) Tes flow: Bikin lelang di PHP -> Muncul di React -> Bid -> Saldo berkurang.

#### Hari 10-11 (Advanced Features):

- (A1) Feature Flags enforcement (matikan fitur via admin, user gak bisa akses).
- (A2) Timer lelang sinkron server-client.
- (A3) Push Notification muncul di browser.

#### Hari 12 (Testing & Fixes):

- Load Testing (JMeter) bareng-bareng.
- Cek Responsiveness CSS.

#### Hari 13-14 (Finalization):

- Lighthouse Audit (Target Score > 90).
- Video Demo & Laporan.

## 3. Catatan Teknis Penting

**Database**: Jangan ubah init.sql sendiri-sendiri. Request ke Anggota 1.

**Port**:

- Nginx: 8080 (Pintu masuk utama)
- Node.js: 3000 (Internal)
- PHP: 9000 (Internal)
- Postgres: 5433 (Supaya tidak bentrok dengan local)

**Session Sharing**: Kita akan menggunakan cookie sharing. Browser kirim PHPSESSID ke Node.js, Node.js cek ke Redis/File session PHP untuk validasi user (Anggota 1 setup ini).