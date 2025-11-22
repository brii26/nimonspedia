# Spesifikasi Teknis: API Contract & WebSocket Events

Dokumen ini adalah acuan resmi bagi tim Frontend (React) dan Backend (Node.js) dalam pertukaran data.

## 1. Konvensi Standar

- **Base URL Node.js**: http://localhost:8080/api/node
- **Base URL PHP**: http://localhost:8080/api/php (Via Nginx)
- **Format Data**: JSON
- **Auth Header (Admin)**: Authorization: Bearer <token>

## 2. REST API Endpoints (Node.js)

### A. Autentikasi Admin

#### 1. Admin Login

**Endpoint**: POST /admin/login

**Request Body**:

```json
{
  "email": "admin@nimons.com",
  "password": "secretpassword"
}
```

**Response (200 OK)**:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1...",
  "user": { "id": 1, "name": "Admin Gro", "role": "ADMIN" }
}
```

### B. Data Lelang (Auction)

#### 1. Get Active Auctions (Public)

**Endpoint**: GET /auctions

**Query Params**: ?status=active atau ?status=scheduled

**Response (200 OK)**:

```json
{
  "success": true,
  "data": [
    {
      "auction_id": 101,
      "product_name": "Pisang Emas",
      "current_price": 50000,
      "image_url": "/storage/products/banana.jpg",
      "end_time": "2025-12-06T10:00:00Z",
      "bid_count": 5
    }
  ]
}
```

## 3. WebSocket Events (Socket.io)

### A. Sistem Koneksi (Handshake)

Client harus mengirim cookie PHP saat koneksi awal agar Node.js bisa mengenali User.

- **Namespace**: / (Default)
- **Auth**: Cookie PHPSESSID (dikirim otomatis oleh browser).

### B. Fitur Lelang (Auction Room)

#### 1. Join Room (Client -> Server)

Saat user membuka halaman detail lelang.

- **Event Name**: join_auction
- **Payload**: { "auction_id": 101 }

#### 2. Place Bid (Client -> Server)

Saat user menekan tombol "Bid".

- **Event Name**: place_bid
- **Payload**:

```json
{
  "auction_id": 101,
  "bid_amount": 55000,
  "user_id": 42
}
```

#### 3. New Bid Broadcast (Server -> Client)

Server memberitahu semua user di room bahwa harga naik.

- **Event Name**: bid_update
- **Payload**:

```json
{
  "auction_id": 101,
  "new_price": 55000,
  "bidder_name": "Kevin (Sensor jika anonim)",
  "bid_time": "2025-12-01T09:00:05Z"
}
```

#### 4. Timer Sync (Server -> Client)

Server menyinkronkan waktu tersisa (agar browser tidak drift).

- **Event Name**: timer_update
- **Payload**: { "auction_id": 101, "seconds_remaining": 300 }

### C. Fitur Chat

#### 1. Join Chat List (Client -> Server)

Agar user menerima notifikasi jika ada chat masuk di room manapun.

- **Event Name**: join_user_channel
- **Payload**: { "user_id": 42 }

#### 2. Send Message (Client -> Server)

- **Event Name**: send_message
- **Payload**:

```json
{
  "room_id": "store_5_user_42",
  "message": "Barang ini ready?",
  "type": "text"
}
```

#### 3. Receive Message (Server -> Client)

- **Event Name**: new_message
- **Payload**:

```json
{
  "room_id": "store_5_user_42",
  "sender_id": 42,
  "message": "Barang ini ready?",
  "timestamp": "2025..."
}
```

#### 4. Typing Indicator (Client <-> Server)

- **Event Name**: typing
- **Payload**: { "room_id": "...", "is_typing": true }

## 4. Struktur Tabel Database Baru (PostgreSQL)

Sebagai referensi bagi Anggota 1 untuk membuat init.sql.

```sql
-- Tabel Lelang
CREATE TABLE auctions (
    auction_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id),
    starting_price DECIMAL(15,2) NOT NULL,
    current_price DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, active, ended
    start_time TIMESTAMP,
    end_time TIMESTAMP
);

-- Tabel Riwayat Bid
CREATE TABLE auction_bids (
    bid_id SERIAL PRIMARY KEY,
    auction_id INT REFERENCES auctions(auction_id),
    user_id INT REFERENCES users(user_id),
    bid_amount DECIMAL(15,2) NOT NULL,
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Chat Room (Unik per pasangan Toko-Buyer)
CREATE TABLE chat_rooms (
    room_id SERIAL PRIMARY KEY,
    store_id INT REFERENCES stores(store_id),
    buyer_id INT REFERENCES users(user_id),
    last_message_text TEXT,
    last_message_time TIMESTAMP,
    UNIQUE(store_id, buyer_id)
);

-- Tabel Pesan
CREATE TABLE chat_messages (
    message_id SERIAL PRIMARY KEY,
    room_id INT REFERENCES chat_rooms(room_id),
    sender_id INT REFERENCES users(user_id), -- Bisa Seller(User) atau Buyer
    message_text TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
