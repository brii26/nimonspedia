Spesifikasi Tugas Besar Milestone 2 IF3110 Web Based Development: Nimonspedia
Tim Asisten Lab Pemrograman 2022
Versi
: 1
Tgl. Revisi Terakhir
: -
Deadline
: Selasa 9 Desember 2025 pukul 22.10 WIB



Revisi:
-

 

Daftar Isi

Daftar Isi	2
Deskripsi Persoalan	5
Tujuan Pembelajaran	8
Spesifikasi Sistem	9
Nginx (Reverse Proxy & Static File Server)	9
PHP Backend	9
Node.js Backend	10
React SPA (Client-Side Application)	10
Database (MySQL/PostgreSQL)	11
Spesifikasi Umum	11
Tabel User (Ada tambahan Role Admin)	12
Tabel Auctions	12
Tabel Auction_Bids	13
Tabel Chat_Room	13
Tabel Chat_Messages	14
Tabel Push_Subscriptions	14
Tabel Push_Preferences	15
Tabel User_Feature_Access	15
User Story Buyer	16
1. Auction	16
2. Chat	16
3. Push Notification	17
User Story Seller	17
1. Auction Management	17
2. Chat	17
3. Product Management	17
4. Push Notification	18
User Story Admin	18
1. Autentikasi dan Profil	18
2. User Management	18
3. User Feature Flags Management	18
Spesifikasi Fitur	19
1. Autentikasi pengguna	19
2. Navigation bar	19
3. Keamanan	20
4. Error handling dan State Indicator	20
5. Responsivitas	20
6. Feature Flags	20
7. Push Notifications	21
8. Websocket	22
9. Pagination	22
10. Load Test	23
11. Docker	23
Spesifikasi Tiap Halaman	24
Halaman Baru (React)	24
1. Halaman Auction List  (Buyer)	24
Acceptance Criteria:	24
Things to Explore:	24
2. Halaman Auction Detail (Buyer & Seller)	25
Acceptance Criteria:	25
3. Halaman Chat (Buyer & Seller)	26
Acceptance Criteria:	26
Things to Explore:	27
4. Halaman Admin Dashboard  (Admin)	27
Acceptance Criteria:	27
5. Halaman Admin Login (Admin)	28
Acceptance Criteria:	28
UPDATE HALAMAN	28
1. Halaman Detail Produk (Buyer)	28
2. Halaman Product Management (Seller)	28
3. Halaman Profile (Buyer & Seller)	28
Spesifikasi Bonus	30
1. All Responsive Web Design	30
2. UI/UX Seperti Tokopedia	30
3. Review & Rating System	30
4. Payment Webhook Integration	31
5. Google Lighthouse	32
Keyword & Tips	33
Lain-Lain	36
Daftar Pertanyaan	36
Deliverables	36
Pengumpulan Tugas	37
Pembagian Kelompok	38
Pembagian Tugas	38

Tujuan Pembelajaran
Mahasiswa mampu mengintegrasikan React SPA dengan backend PHP existing
Mahasiswa memahami dan mengimplementasikan JWT authentication
Mahasiswa mampu mengimplementasikan WebSocket untuk fitur real-time
Mahasiswa memahami konsep Service Worker
Mahasiswa mampu mengimplementasikan Push Notification di browser
Mahasiswa mampu melakukan load testing dan optimasi kinerja
Mahasiswa memahami konsep reverse proxy dengan Nginx

Spesifikasi Sistem


Gambaran Umum untuk Milestone 2
Milestone 2 merupakan kelanjutan dari Milestone 1 dengan penambahan fitur real-time menggunakan WebSocket, React SPA, dan sistem administrasi. Arsitektur aplikasi akan menggunakan kombinasi PHP (legacy features), Node.js (real-time features), dan React (modern UI).
Komponen Sistem
Nginx (Reverse Proxy & Static File Server)
Wajib digunakan sebagai reverse proxy dan static file server
Routing request ke PHP atau Node.js berdasarkan path
Serving static files untuk React SPA (HTML, JS, CSS, assets)
WebSocket proxy untuk real-time communication
PHP Backend
Menjalankan semua fitur dari Milestone 1
Menangani autentikasi buyer/seller (session-based)
Menyediakan REST API untuk React
Generate session untuk WebSocket authentication
Berkomunikasi dengan database MySQL/PostgreSQL
Node.js Backend
WebSocket server untuk real-time features
Menangani auction logic (bidding, countdown, winner determination)
Menangani chat real-time
Menangani admin authentication (JWT-based)
Trigger push notifications
Enforce feature flags dan global flags
Membuat order otomatis saat auction selesai
Menyediakan REST API untuk admin
Berkomunikasi dengan database MySQL/PostgreSQL
Recommended tools:
Express, Hono, atau Nest.js
Socket.io
React SPA (Client-Side Application)
Berjalan di browser client setelah di-download dari Nginx
Static files (HTML, JS, CSS) di-build menggunakan Vite/CRA dan di-host oleh Nginx
Wajib digunakan untuk:
Chat Page
Auction Page (list & detail)
Admin Dashboard
Komunikasi:
Dengan PHP Backend via REST API
Dengan Node.js Backend via WebSocket & REST API
State management dengan React hooks (useState, useContext, useReducer)
Recommended setup:
Vite sebagai build tool (alternatif: Create React App)
React Router DOM
Socket.io-client untuk WebSocket client
Axios atau Fetch API untuk HTTP requests
Boleh menggunakan TailwindCSS tapi tidak dengan UI library.
Database (MySQL/PostgreSQL)
Shared database antara PHP dan Node.js
Schema dari Milestone 1 + tambahan untuk Milestone 2
Menyimpan data users, products, auctions, bids, chat messages, push subscriptions, dll.
Spesifikasi Umum
Berikut ada beberapa ketentuan umum yang harus dipenuhi oleh sistem.
Untuk client-side PHP, mengikuti aturan Milestone 1: wajib menggunakan JavaScript, HTML, dan CSS secara murni tanpa framework. Untuk halaman baru (auction dan chat) wajib menggunakan React. 
Untuk server-side, wajib menggunakan PHP murni tanpa kakas apapun (seperti Laravel, Codeigniter). Akan tetapi, kalian bisa mengambil inspirasi dari struktur project pada Laravel dan sebagainya. Kalian harus mengimplementasikan fitur menggunakan HTTP method yang tepat dan sesuai best practices. 
Secara default, tidak boleh menggunakan library apapun selain untuk query database dan quill.js (untuk rich text editor). Jika ada library yang ingin digunakan, silahkan tanyakan melalui QnA untuk dipertimbangkan.
Dalam melakukan request ke server, kalian dapat menggunakan basic form handling ataupun AJAX, dengan setidaknya tiga penggunaan pada masing-masing tipe.
Untuk basis data, wajib menggunakan MySQL, MariaDB, atau PostgreSQL (Relational Database). Tidak diperbolehkan menggunakan ORM atau sejenisnya dan tidak boleh menyimpan blob atau binary file pada basis data. Skema yang diberikan di bawah ini dapat dijadikan panduan (tidak wajib sama). Kalian dapat menyesuaikan dan mengoptimalkan skema tersebut sesuai kebutuhan, misal jika ingin membuat multiple image untuk produk.
Tabel User (Ada tambahan Role Admin)
Nama
Tipe
Keterangan
user_id
int
Primary key, auto increment
email
string
email address, unique
password
string
Hashed password
role
enum
“BUYER”, “SELLER”, “ADMIN”
name
string
Full name pengguna
address
string
Alamat Pengguna
balance
int
Default 0 (hanya berguna untuk role BUYER)
created_at
datetime
Registration timestamp
updated_at
datetime
Last Update timestamp

Tabel Auctions
Nama
Tipe
Keterangan
auction_id
int
Primary key, auto increment
product_id
int
Foreign key to Product
starting_price
int
Harga awal lelang
current_price
int
Harga bid tertinggi saat ini (default = starting_price)
min_increment
int
Minimum kenaikan bid
quantity
int
Jumlah item yang dilelang (dari stock product)
start_time
datetime
Waktu mulai auction
end_time
datetime
Waktu selesai auction, nullable, diisi ketika auction sudah berakhir.
status
enum
"scheduled", "active", "ended", "cancelled"
winner_id
int
Foreign key to User (buyer), nullable
created_at
datetime
Auction creation timestamp

Tabel Auction_Bids
Nama
Tipe
Keterangan
bid_id
int
Primary key, auto increment
auction_id
int
Foreign key to Auctions
bidder_id
int
Foreign key to User (buyer)
bid_amount
int
Jumlah bid
bid_time
datetime
Waktu bid dibuat (default now)

Tabel Chat_Room
Nama
Tipe
Keterangan
store_id
int
Foreign key to Store, PK
buyer_id
int
Foreign key to User (buyer), PK
last_message_at
datetime
Timestamp pesan terakhir, nullable
created_at
datetime
Room creation timestamp (default now)
updated_at
datetime
Last update timestamp (default now)


Tabel Chat_Messages
Nama
Tipe
Keterangan
message_id
int
Primary key, auto increment
store_id
int
Foreign key ke Chat_Rooms (bagian dari composite key)
buyer_id
int
Foreign key ke Chat_Rooms (bagian dari composite key)
sender_id
int
Foreign key to User
message_type
enum
"text", "image", "item_preview"
content
text
Message content (text atau path untuk image)
product_id
int
Foreign key to Product (jika type = item_preview), nullable
is_read
boolean
Default false
created_at
datetime
Message timestamp (default now)


Tabel Push_Subscriptions
Nama
Tipe
Keterangan
subscription_id
int
Primary key, auto increment
user_id
int
Foreign key to User
endpoint
text
Push service endpoint URL
p256dh_key
string
Public key untuk encryption
auth_key
string
Auth secret untuk encryption
created_at
datetime
Subscription timestamp (default now)

Tabel Push_Preferences
Nama
Tipe
Keterangan
user_id
int
Primary key, Foreign key to User
chat_enabled
boolean
Enable push untuk chat (default true)
auction_enabled
boolean
Enable push untuk auction (default true)
order_enabled
boolean
Enable push untuk order (default true)
updated_at
datetime
Last update timestamp (default now)

Tabel User_Feature_Access
Nama
Tipe
Keterangan
access_id
int
Primary key, auto increment
user_id
int
Foreign key to User, Null apabila menandakan global
feature_name
enum
“checkout_enabled”, “chat_enabled”, 
“auction_enabled”
is_enabled
boolean
Default true
reason
text
Alasan disable feature, nullable
updated_at
datetime
Last update timestamp (default now)





















User Story Buyer
Auction
Buyer dapat melihat daftar auction yang sedang aktif dan yang akan datang (scheduled)
Buyer dapat melihat detail auction dengan informasi lengkap dan countdown timer real-time
Buyer dapat join auction session dan place bid
Buyer melihat bid update secara real-time tanpa refresh
Buyer menerima push notification saat di-outbid, menang auction, atau auction akan berakhir
Chat
Buyer dapat melihat daftar chat rooms dan memulai chat baru dengan store
Buyer dapat mengirim message text, image attachment, dan item preview
Buyer melihat message baru, typing indicator, dan read receipts secara real-time
Buyer menerima push notification saat ada message baru dari seller
Buyer tidak dapat send message jika feature flag disabled
Push Notification
Buyer dapat mengatur preferensi push notification per-category (chat, auction, order) di Profile




User Story Seller
Auction Management
Seller dapat membuat auction dari produk yang sudah ada dengan input quantity, starting price, min increment, dan end time
Seller hanya dapat memiliki 1 auction aktif dalam satu waktu
Seller dapat melihat auction yang sedang berjalan dengan bid history dan countdown timer real-time
Seller dapat cancel auction sebelum ada bid
Saat auction berakhir dengan winner, order otomatis dibuat dengan status "approved"
Chat 
Seller dapat melihat daftar chat rooms dengan buyers
Seller dapat mengirim message text, image attachment, dan item preview
Seller melihat message baru, typing indicator, dan read receipts secara real-time
Seller menerima push notification saat ada message baru dari buyer
Seller tidak dapat send message jika feature flag disabled
Product Management
Seller dapat melihat badge "DALAM LELANG" pada produk yang sedang dilelang
Seller tidak dapat edit/delete produk yang sedang dilelang
Seller dapat membuat auction dari produk via tombol "Jadikan Lelang"
Push Notification
Seller dapat mengatur preferensi push notification per-category (chat, auction, order) di Profile


User Story Admin
Autentikasi dan Profil
Admin dapat login menggunakan email dan password via Admin Dashboard 
Admin login menggunakan JWT authentication (berbeda dari buyer/seller)
JWT disimpan di localStorage dan valid selama 1 jam (ketika demo)
Admin dapat logout dari sistem
User Management
Admin dapat melihat daftar semua users (buyer dan seller)
Admin dapat search user berdasarkan nama atau email
Admin dapat filter user berdasarkan role (buyer/seller)
User Feature Flags Management
Admin dapat melihat feature flags untuk user tertentu
Admin dapat enable/disable feature flags untuk user tertentu
Admin harus memberikan reason saat disable feature
User yang di-disable akan melihat reason saat mencoba menggunakan feature
Admin dapat re-enable feature kapan saja
Global Feature Flags Management
Admin dapat enable/disable global feature flags






Spesifikasi Fitur
Berikut ada beberapa ketentuan terkait fitur-fitur apa saja yang ada di dalam sistem. Spesifikasi dari Milestone 1 tetap berlaku.
Autentikasi pengguna
Admin Authentication
Admin menggunakan sistem autentikasi yang berbeda:
Login melalui Admin Dashboard (React)
Menggunakan JWT (JSON Web Token) yang di-generate oleh Node.js
JWT disimpan di localStorage browser
Setiap request ke admin endpoints harus include JWT di header
Jika JWT expired atau invalid, redirect ke halaman login admin
WebSocket Authentication
Untuk koneksi WebSocket (Chat & Auction):
Menggunakan PHP session cookie yang sudah ada
Browser otomatis mengirim session cookie saat WebSocket handshake
Node.js verify session dengan query ke database atau Redis
Jika session valid, connection accepted dengan metadata user (user_id, role)
Jika session invalid, connection rejected dengan error 401
Navigation bar
Berikut merupakan tambahan dari hal yang perlu ada di Navigation Bar
Buyer (sudah login):
Link "Lelang" (link ke Auction Page Buyer) 
Link "Chat" (link ke Chat Page Buyer) 
Seller (sudah login):
"Lelang" (link ke Auction Page Seller)
"Chat" (link ke Chat Page Seller)
Keamanan
WebSocket connections harus ter-autentikasi (verify session/JWT)
Feature flags harus di-enforce di server-side (PHP & Node.js), bukan hanya UI
Push notification payload harus di-encrypt (handled by Web Push API)
Admin endpoints harus protected dengan JWT verification
XSS prevention untuk chat messages (sanitize input, escape output)
Error handling dan State Indicator
Implementasikan beberapa hal berikut untuk page-page baru kalian:
Loading states untuk async operations (skeleton screens, spinners)
Error boundaries untuk handle React errors
Toast notifications untuk success/error messages
WebSocket connection status indicator
Optimistic UI updates dengan rollback jika error
Responsivitas
Implementasikan minimal Halaman Chat yang responsif (minimal untuk ukuran 1280 x 768 dan 400 x 800). Artinya, tampilan mungkin berubah menyesuaikan ukuran layar.
Feature Flags
Feature flags memungkinkan admin untuk enable/disable fitur tertentu untuk user atau globally. Untuk fitur yang di disable diharapkan dihapus dari navbar.
Buatlah sebuah halaman disabled state yang menjadi tempat default ketika ada pengguna yang mencoba untuk mengakses halaman yang sedang tidak tersedia baginya. Tampilkan pesan alasan dimatikannya fitur tertentu kepada pengguna (Mainenance jika fitur global, alasan spesifik jika untuknya). 

User-Specific Feature Flags
Disable feature untuk user tertentu dengan reason. 
Global Feature Flags
Disable feature untuk semua user (maintenance mode).
3 Flag yang dapat dinyalakan/matikan:
auction_enabled
chat_enabled
Checkout_enabled (Disable dari navbar dan juga functionality untuk add to cart)

Push Notifications
Push notification adalah cara yang bagus untuk membuat pengguna tetap terlibat dengan aplikasi. Server dapat mengirimkan push notification ke client bahkan saat client tidak aktif.
Push notification di aplikasi web melibatkan kombinasi dari browser APIs, service worker, dan server yang dapat mengirim pesan. Jika browser sedang offline, pesan akan di-queue (diantrikan) hingga browser online. Pengguna dapat memilih untuk menerima notifikasi ini dari situs web.
Use Case Notifikasi
Chat Notification
Saat pengguna menerima pesan dari pengguna lain, maka notifikasi harus dimunculkan dengan isi notifikasi adalah pengguna lain yang mengirim dan pesan yang dikirim. Saat pengguna click notifikasi, maka akan langsung di-redirect ke chat tersebut.
NOTE: Pastikan notifikasi hanya dimunculkan pada user yang bersangkutan.
Auction Notification
Notifikasi untuk event auction:
Outbid Notification
Win Auction Notification
Ending Soon Notification
Order Notification
Saat order status berubah (approved, rejected, on_delivery, received), notifikasi harus dimunculkan kepada buyer atau seller yang bersangkutan.
Referensi
Berikut adalah beberapa referensi terkait Implementasi Push Notification:
PushSubscription - Web APIs | MDN
Push API - Web APIs | MDN
Push Notification in React and Next.js app using Node.js | by Reetesh Kumar | Medium
Websocket
WebSocket digunakan untuk komunikasi real-time di Chat dan Auction.
WebSocket Server (Node.js)
Menggunakan Socket.io atau ws library
Handle connection authentication (verify PHP session)
Handle events: connect, disconnect, error
Broadcast updates ke clients yang relevant
Implement heartbeat/ping-pong untuk keep-alive
WebSocket Client (React)
Connect ke WebSocket server dengan session cookie
Auto-reconnect pada disconnect
Emit events ke server (send message, place bid)
Listen events dari server (new message, bid update)
Pagination
Ketentuan Pagination sama seperti Milestone 1. Untuk memudahkan, tidak terdapat ketentuan mengenai berapa jumlah halaman yang menggunakan infinite scroll dan juga server side pagination. Silakan implementasikan yang lebih sesuai dengan preferensi kalian. Gunakan Cursor Based Pagination untuk memastikan performa yang lebih baik pada data yang relatif sering untuk berubah (minimal 1).
Load Test
Load testing adalah proses menguji performa aplikasi dengan memberikan beban yang tinggi untuk mengukur response time dan kemampuan sistem menangani concurrent requests. Pada tugas besar ini, load testing akan dilakukan untuk 4 endpoint GET products dengan skenario berbeda.
Get All Products
Get Products with Range
Get Products with Filter
Get Products with Search
Mekanisme lengkap untuk load test akan di rilis dalam beberapa hari ke depan.
Docker
Pada template dari repository yang ada di Github Classroom, sudah terdapat Dockerfile dan docker-compose.yml yang belum dapat dijalankan. Silahkan diimplementasikan sehingga docker dapat dijalankan pada saat demo. Pastikan aplikasi dapat berjalan tanpa kakas apapun selain docker. Kalian juga boleh menggunakan docker untuk development, tetapi tidak diwajibkan dan bukan bagian dari penilaian. Beberapa hal yang direkomendasikan untuk ada di dalam docker adalah:
nginx service (reverse proxy)
php service
node service
db service
redis service (opsional, untuk session sharing) 



Spesifikasi Tiap Halaman
Spesifikasi disini bersifat sebagai guide dari halaman yang perlu dibuat. Kalian dibebaskan untuk menyesuaikan tampilan dari halaman yang ada, selama seluruh Acceptance Criteria dipenuhi. Perhatikan pula Things to Explore yang mungkin berguna untuk membantu kalian membuat halaman yang baik (atau ketika demo).  
Halaman Baru (React)
Halaman Auction List  (Buyer)
Halaman yang menampilkan daftar auction yang tersedia, baik yang sedang aktif maupun yang akan datang (scheduled). Tampilan dibebaskan formatnya.
Acceptance Criteria:
Terdapat tab/section untuk "Lelang Aktif" dan "Lelang Akan Datang"
Countdown timer update setiap detik tanpa refresh (client-side) di setiap produk untuk menunjukkan berapa lama lagi lelang mereka akan dibuka / ditutup.
Terdapat pagination
Terdapat search berdasarkan toko dan nama produk (tidak perlu filter) dengan debounce.
Setiap Card Auction setidaknya mengandung  product image, nama produk, current bid/starting price, countdown timer (aktif) atau waktu mulai (scheduled), jumlah bidders
Apabila lelang  baru dimulai ketika pengguna sudah masuk di satu halaman, maka UI akan otomatis berubah tanpa perlu refresh.
Card Auction akan redirect ke halaman Auction Detail 
	Things to Explore:
WebSocket connection management dan auto-reconnect
Real-time countdown timer dengan setInterval
Optimistic UI updates 

Contoh Countdown yang menempel ke lelang tertentu.
Halaman Auction Detail (Buyer & Seller)
Halaman detail untuk satu auction spesifik dengan fitur real-time bidding. Lelang dapat berhenti dalam 2 kondisi utama:
Tidak terdapat bid yang lebih tinggi dalam waktu 15 detik setelah bid terakhir masuk ke sistem (tampilkan counter mundur).
Penjual menghentikan (bukan cancel), lelang dengan sendirinya.
Initial countdown dihitung dari server timestamp sebagai source of truth. Countdown berjalan di client-side dengan update setiap detik. WebSocket broadcast dilakukan saat ada bid baru untuk recalculate countdown (kembali menjadi 15 detik). Auto-sync dengan server dilakukan setiap 30 detik untuk koreksi drift. Countdown stop di 0 akan trigger auction end logic
Ketika pembeli melakukan bid, balance mereka akan  langsung berkurang, tetapi akan kembali apabila mereka bid mereka dikalahkan. Ketika sudah terdapat pemenang, akan langsung terbentuk order dengan status ‘approved’ dan penjual hanya perlu untuk menentukan tanggal pengirimannya. Pastikan integritas data tetap terjaga di kondisi ini.
Seller juga bisa mengakses halaman ini, tetapi tidak dapat melakukan bidding. Mereka hanya bisa melihat kondisi lelang sekarang serta dapat menghentikan lelang.
Acceptance Criteria:
Ada Section product information: large image, nama produk, deskripsi lengkap (rich text), quantity yang dilelang, store name (clickable ke store detail)
Section auction information: starting price, current highest bid (real-time), minimum increment, countdown timer (update setiap detik), waktu mulai & berakhir
Section bid input (buyer only): input bid amount dengan validation real-time, display minimum bid requirement, display user balance, button "Place Bid" (disabled jika insufficient balance atau invalid input)
Section bid history: tabel dengan kolom (Bidder name (boleh anonim)/Anda, Bid amount, Time), real-time update, highlight bid dari user sendiri, show latest 10 bids dengan button "Load More", display total bidders count
Seller view: tidak bisa bid, button "Cancel Lelang" (hanya jika belum ada bid), atau “Hentikan Lelang” (jika sudah ada bid). Confirmation modal untuk cancel.
Status handling berbeda untuk SCHEDULED (show countdown to start, disable bid), AKTIF (enable bid), BERAKHIR (show winner info), CANCELLED (show reason)
Validation: bid amount >= current_price + min_increment, balance >= bid amount, auction status = AKTIF

Halaman Chat (Buyer & Seller)
Halaman chat yang menampilkan list chat rooms (sidebar) dan chat room interface (main panel) dalam satu halaman.
Acceptance Criteria:
Sidebar (Chat List):
Tampilkan semua chat rooms user dengan search box di atas
Setiap room card menampilkan: store logo & name (buyer) atau buyer name (seller), last message preview (truncate 50 chars), timestamp (format: "5 menit lalu", "Kemarin", "12 Jan"), unread badge count
Sort by last_message_at (newest first)
Search by store/buyer name (debounce 300ms)
Empty state: "Belum ada percakapan" dengan button "Mulai Chat" (buyer only)
Button "Chat Baru" (buyer) → modal dengan list stores untuk memulai chat
Highlight active room
Real-time update: new message → update preview & move to top, update unread count
Main Panel (Chat Room):
Header menampilkan logo & nama toko (pembeli) atau nama pembeli (penjual).
Pesan ditampilkan urut dari yang paling lama ke yang terbaru.
Tampilan otomatis scroll ke bawah ketika ada pesan baru.
Bubble pesan berbeda: pesan sendiri di kanan (biru), pesan lawan bicara di kiri (abu-abu).
Setiap pesan menampilkan timestamp.
Status pesan memakai ikon centang untuk terkirim, diterima, dan dibaca (format dibebaskan)
Indikator mengetik muncul sebagai “[Nama] sedang mengetik…” selama 3 detik setelah aktivitas mengetik terakhir.
Saat membuka chat, sistem memuat 50 pesan terakhir.
Saat scroll ke atas, sistem memuat 50 pesan tambahan yang lebih lama.
Menampilkan loading skeleton saat pesan sedang dimuat.
	Things to Explore:
Typing indicator

Halaman Admin Dashboard  (Admin)
Halaman dashboard admin dengan semua fitur dalam satu halaman. Halaman ini berisi daftar user beserta dengan sebuah search bar. Untuk masing-masing pengguna, admin dapat mengatur feature flags secara individual. Terdapat pula sebuah section untuk menyalakan/mematikan Global Feature Flags.
Acceptance Criteria:
Redirect ke login jika JWT tidak valid
Header dengan info admin, dan tombol logout
Search bar untuk cari user by nama/email (debounce 300ms)
Tabel user: ID, Nama, Email, Role, Balance, Tanggal Daftar, button "Kelola Flags"
Pagination
Click "Kelola Flags" → expand form atau modal dengan 3 checkboxes (Checkout, Chat, Auction)
Jika uncheck flag → textarea "Alasan" (required, min 10 char)
Tampilkan current status flags (highlight merah jika disabled)
Section Global Flags dengan warning banner dan 3 toggle: Auction Enabled, Chat Enabled, Checkout Enabled
Jika toggle off → textarea "Alasan" (required, min 20 char)
Tampilkan status global flags dengan warna (hijau/merah)
Button "Simpan" dengan confirmation modal untuk global flags
Toast notification success/error
Loading state dan empty state
Halaman Admin Login (Admin)
Halaman login khusus untuk admin dengan JWT authentication. Tampilan dibebaskan, selama memenuhi ketentuan dari M1. 
Acceptance Criteria:
Sama dengan Halaman Login di M1. Untuk akun Admin, silahkan HARDCODE di database. 
UPDATE HALAMAN
Halaman Detail Produk (Buyer)
Tambahkan tombol “Start Chat” ke toko terkait. Serta “Pergi ke Lelang” apabila barang terkait memiliki sesi lelang yang available. 
Halaman Product Management (Seller)
Tambahkan opsi untuk memulai lelang. Kemudian munculkan sebuah popup / halaman baru untuk memasukkan informasi lelang, yaitu:
Jam mulai lelang
Kuantitas barang yang ingin di lelang
Minimum increment ( jumlah perubahan minimal dari bid terakhir)
Starting price
Berikan pula opsi untuk melihat lelang / hasil lelang kepada barang-barang yang terdaftar di lelang tertentu.
Halaman Profile (Buyer & Seller)
Tambahkan Section "Pengaturan Notifikasi" dengan 3 checkboxes:
Notifikasi Chat 
Notifikasi Lelang
Notifikasi Pesanan

Spesifikasi Bonus
Catatan: Kerjakan dahulu spesifikasi wajib sebelum mengerjakan bonus.
All Responsive Web Design
Semua tampilan dibuat responsif (minimal untuk ukuran 1280 x 768 dan 400 x 800). Artinya, tampilan mungkin berubah menyesuaikan ukuran layar. Hint: gunakan CSS @media rule, lebih lanjut: https://www.w3schools.com/css/css_rwd_mediaqueries.asp.

UI/UX Seperti Tokopedia
Membuat UI/UX yang serupa dengan tampilan website Tokopedia, dengan desain yang konsisten dan responsif untuk setiap halaman. Siapa tahu nanti kalian bisa dapat pekerjaan di Tokopedia. Kalian dapat menyesuaikan dengan fitur yang ada pada spesifikasi ini. 

Review & Rating System
Fitur review dan rating untuk produk setelah order diterima. Fitur ini juga memberikan kewenangan bagi admin untuk melakukan modifikasi secara khusus seperti yang dijelaskan pada ketentuan nomor 5.
Ketentuan:
Buyer dapat memberikan review setelah order status = "received"
Review mencakup: rating (1-5 stars), text review (max 500 char), photo review (optional, max 3 images)
Menampilkan average rating dan review count di product detail
Menampilkan latest reviews di product detail (pagination)
Admin dapat me-moderasi reviews: hide inappropriate reviews, respond to reviews.
Seller dapat respond to reviews (one reply per review)

Payment Webhook Integration
Integrasi dengan payment gateway untuk menerima notifikasi status pembayaran secara real-time via webhook.
Ketentuan:
Integrasi dengan payment provider (pilih salah satu):
Midtrans (Sandbox/Development mode)
Xendit (Test mode)
Mock payment gateway (self-implemented)
Buyer dapat top-up balance atau pay order via payment gateway
Webhook endpoint untuk menerima notification dari payment provider
Update balance/order status otomatis setelah payment confirmed
Handle berbagai payment status: pending, success, failed, expired
Flow:
User klik "Top-up Balance" atau "Bayar Order"
Redirect ke payment gateway page (Midtrans/Xendit)
User complete payment
Payment gateway kirim webhook ke /api/node/webhook/payment
Verify webhook signature
Update balance/order status di database
Send push notification ke user
	
	PERLU DIPERHATIKAN:
IDEMPOTENCY. Pastikan update database tidak double jika webhook dikirim lebih dari sekali. Payment gateway mungkin saja retry.
	
Notes: Eksplor pula secara mandiri, baik langkah-langkah yang perlu dilakukan untuk mencegah security concern yang mungkin terjadi, ataupun best practice dalam melakukan payment webhook integration ini.
Google Lighthouse
Google Lighthouse adalah alat otomatis open-source untuk meningkatkan kualitas halaman web. Lighthouse dipakai sebagai alat pengukuran dan audit untuk performance kualitas website, aksesibilitas, aplikasi web progresif, dan banyak lagi. Tugas kalian adalah melakukan pengecekan skor di Lighthouse untuk seluruh halaman dan pastikan bahwa skor untuk best practices, aksesibilitas yang didapatkan memiliki nilai di atas 90 dan performance yang didapatkan memiliki nilai di atas 80. Jika pada saat pertama kali pengukuran skor masih kurang, tetap capture dan jelaskan perubahan apa yang kalian lakukan untuk mencapai nilai yang lebih baik. Lampirkan bukti tangkapan layar pada README.


Keyword & Tips
Untuk meringankan beban tugas ini, ada beberapa keyword yang bisa kalian cari untuk menyelesaikan tugas ini.
HTTP & API: GET, POST, PUT, DELETE, REST API, JSON, AJAX, Fetch API, WebSocket, Socket.io, CORS, JWT
CSS & Styling: margin, padding, flex, grid, Tailwind CSS, media queries, transitions
JavaScript & React: useState, useEffect, useContext, React Router, addEventListener, fetch, async/await, map
PHP: PDO, $_SESSION, $_POST, $_GET, json_encode, json_decode, session_start, move_uploaded_file
Node.js: Express.js, middleware, Socket.io, rooms, emit, broadcast, jsonwebtoken, bcrypt, web-push
SQL: SELECT, INSERT, UPDATE, DELETE, JOIN, WHERE, ORDER BY, LIMIT, INDEX, TRANSACTION
Docker: Dockerfile, Docker Compose, services, volumes, networks, environment variables
Nginx: proxy_pass, location, WebSocket proxy, static files, reverse proxy
Web APIs: Notification API, pushManager, Service Worker, localStorage, WebSocket AP

Berikut adalah tips dari asisten tercinta.
Pisahkan React components ke folder terpisah (components/, pages/, layouts/) dan buat reusable components seperti Button, Modal, dan Card untuk kemudahan maintenance. Gunakan custom hooks untuk extract logic yang sering dipakai seperti useWebSocket atau useAuth.
Untuk Node.js backend, pisahkan routes, controllers, dan services agar kode menjadi lebih modular. Gunakan .env file untuk menyimpan credentials seperti JWT secret, VAPID keys, dan database credentials. JANGAN PERNAH commit file .env ke git.
Selalu cleanup side effects di useEffect seperti disconnect WebSocket dan clear intervals untuk mencegah memory leaks. Berikan ke8y yang unik saat map array di React, jangan gunakan index sebagai key (reference).
Untuk WebSocket, verify session atau JWT di setiap connection dan gunakan rooms untuk group connections seperti chat rooms atau auction sessions. Handle disconnect/reconnect dengan baik dan implement auto-reconnect di client-side.
Buat indexes di database untuk columns yang sering di-query seperti foreign keys dan search fields. Gunakan prepared statements untuk prevent SQL injection dan gunakan transactions untuk operations yang harus atomic seperti deduct balance + create order.
Dalam menggunakan Docker, pahami dulu perbedaan docker image dan docker container, serta cara kerja port forwarding, volume, dan network. Gunakan .dockerignore untuk exclude node_modules dan gunakan named volumes untuk data persistence seperti database data.
Untuk Nginx, pahami cara konfigurasi reverse proxy dengan proxy_pass dan cara setup WebSocket proxy dengan proxy_http_version, Upgrade, dan Connection headers. Pisahkan routing untuk PHP, Node.js API, dan React static files.
Selalu validate dan sanitize input di server-side, jangan hanya di client-side. Gunakan bcrypt untuk hash password, set expiration time untuk JWT, dan enforce feature flags di backend bukan hanya di UI.
Implement debouncing untuk search input dan typing indicator (300-500ms), gunakan pagination untuk list data, dan optimize images dengan compression dan lazy loading. Minimize re-renders di React dengan React.memo, useMemo, dan useCallback.
Test WebSocket dan Push Notification di BERBAGAI browsers (Chrome, Firefox, Safari) karena implementasinya bisa berbeda. Gunakan Browser DevTools Network tab untuk debug WebSocket messages dan API calls.
JANGAN COMMIT node_modules, vendor folders, atau .env ke git.