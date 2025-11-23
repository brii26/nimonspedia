# Panduan Teknis Pengembangan Nimonspedia

Dokumen ini berisi panduan teknis untuk pengembangan Nimonspedia, dengan fokus pada arsitektur hybrid (PHP + Node.js + React), integrasi kode legacy, dan panduan pembuatan fitur baru.

## 1. Bekerja dengan Kode Legacy (PHP)

Nimonspedia awalnya dibangun menggunakan PHP murni (Native) dengan arsitektur MVC (Model-View-Controller) yang dibuat sendiri (custom framework).

### Struktur Dasar

- `src/core/`: Berisi framework dasar (`Router.php`, `Database.php`, `View.php`). Jangan ubah file ini kecuali untuk perbaikan bug kritis di level framework.
- `src/app/controllers/`: Logika bisnis utama.
- `src/app/repository/`: Akses ke database (mirip Model tapi lebih terstruktur).
- `src/app/views/`: Tampilan HTML (dicampur dengan sedikit PHP untuk rendering data).

### Aturan Main

- **Database Access**: Selalu gunakan Repository untuk query ke database. Jangan lakukan query SQL langsung di Controller atau View.
- **Routing**: Tambahkan route baru di `src/core/Application.php` (method `setupRoutes`).
- **Session**: Session PHP disimpan di Redis (`php.ini` sudah dikonfigurasi). Ini memungkinkan session dibaca oleh Node.js.

### Contoh Flow Request PHP

User membuka `/products` -> Nginx -> PHP-FPM -> `index.php` -> `Application.php` -> `Router.php` -> `ProductController::index()` -> `ProductRepository::findAll()` -> `View::render('pages/products/index')`.

## 2. Arsitektur Baru (Hybrid System)

Pada Milestone 2, kita menambahkan lapisan modern di atas sistem legacy.

### Struktur Folder

- `/` (Root): Berisi kode PHP Legacy, config Docker, dan Nginx.
- `/client`: Frontend React (SPA) untuk fitur interaktif (Chat, Lelang, Admin).
- `/server`: Backend Node.js untuk fitur Real-time, API Admin, dan Job Queue.

### Pembagian Tugas Nginx (Reverse Proxy)

- Request ke `/` (dan path lain yang tidak spesifik) -> Container PHP.
- Request ke `/api/node/...` -> Container Node.js.
- Request ke `/socket.io/...` -> Container Node.js (WebSocket).
- Request ke Static Files (`/assets`, `/storage`) -> Dilayani langsung oleh Nginx.

### Autentikasi (Session Sharing)

- **User (Buyer/Seller)**: Login di PHP. PHP menyimpan Session ID di Cookie `PHPSESSID` dan data di Redis. Node.js membaca cookie ini untuk autentikasi WebSocket.
- **Admin**: Login di React (Client). Node.js memvalidasi kredensial dan memberikan JWT Token. Token ini disimpan di localStorage browser dan dikirim di header `Authorization: Bearer <token>` untuk setiap request API Admin.

## 3. Tutorial: Menambah API Baru di Server (Node.js)

Misalkan kita ingin membuat fitur baru: Melihat Log Aktivitas User (hanya untuk Admin).

### Langkah 1: Buat Repository

Buat file `server/src/repositories/activityLogRepository.js` untuk menangani query database.

```javascript
const pool = require('../config/database');

class ActivityLogRepository {
  async getAllLogs({ limit, offset }) {
    const query = 'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }
}

module.exports = new ActivityLogRepository();
```

### Langkah 2: Buat Controller

Buat file `server/src/controllers/activityLogController.js` untuk menangani logic request.

```javascript
const activityLogRepository = require('../repositories/activityLogRepository');

exports.getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const logs = await activityLogRepository.getAllLogs({ limit, offset });

    res.json({
      success: true,
      data: logs,
      page: page
    });
  } catch (error) {
    console.error('Get Logs Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

### Langkah 3: Daftarkan Route

Edit file `server/src/routes/adminRoutes.js` untuk menambahkan endpoint baru.

```javascript
// ... import controller lainnya
const activityLogController = require('../controllers/activityLogController');

// ... route lainnya

// Tambahkan route baru (Protected)
router.get('/activity-logs', verifyAdminToken, activityLogController.getLogs);

module.exports = router;
```

### Langkah 4: Testing

- Pastikan server Node.js berjalan (`docker-compose up -d node-server`).
- Gunakan Postman/Curl.
- Login sebagai Admin untuk dapat Token JWT.
- Hit endpoint: `GET http://localhost:8080/api/node/admin/activity-logs` dengan Header `Authorization: Bearer <TOKEN>`.

## 4. Integrasi dengan Client (React)

Setelah API siap, tim Frontend (Client) bisa menggunakannya.

Buka `client/src/services/api.js` (atau file konfigurasi axios). Buat fungsi helper untuk memanggil API tersebut.

```javascript
export const getActivityLogs = async (page = 1) => {
  const response = await axiosInstance.get(`/admin/activity-logs?page=${page}`);
  return response.data;
};
```

Gunakan di Komponen React.

```javascript
// Di dalam useEffect
useEffect(() => {
  getActivityLogs(1).then(data => setLogs(data.data));
}, []);
```

## 5. Tutorial WebSocket (Real-time)

Bagian ini menjelaskan cara mengimplementasikan fitur real-time menggunakan Socket.io, misalnya untuk notifikasi chat atau update harga lelang.

### Konsep Dasar

- **Event-Based**: Komunikasi terjadi melalui pengiriman dan penerimaan event (`emit` dan `on`).
- **Room**: Digunakan untuk mengelompokkan user (misal: room per chat ID atau per auction ID).

### Langkah 1: Buat Handler Socket (Server-Side)

Buat file baru, misal `server/src/sockets/notificationSocket.js`.

```javascript
module.exports = (io, socket) => {
  // User join ke channel pribadi mereka untuk notifikasi personal
  socket.on('join_notifications', (userId) => {
    // Pastikan validasi user ID sesuai session yang login
    if (socket.user && socket.user.user_id === userId) {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined notification channel`);
    }
  });

  // Contoh event lain: admin mengirim pengumuman
  socket.on('admin_broadcast', (message) => {
      // Validasi admin (biasanya dilakukan di middleware atau logic khusus)
      // ...
      io.emit('announcement', { message, timestamp: new Date() });
  });
};
```

### Langkah 2: Daftarkan Handler di index.js

Edit `server/index.js` untuk menggunakan handler baru.

```javascript
// ... import handler lain
const registerNotificationHandlers = require('./src/sockets/notificationSocket');

// ...

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.user.name}`);

  // ... register handler lain
  registerNotificationHandlers(io, socket);

  // ...
});
```

### Langkah 3: Implementasi di Client (React)

Gunakan `socket.io-client` di komponen React.

```javascript
import { useEffect } from 'react';
import { io } from 'socket.io-client';

// Inisialisasi socket di luar komponen atau dalam Context agar singleton
// Ganti URL sesuai environment
const socket = io('/', { 
    path: '/socket.io',
    withCredentials: true // Penting untuk kirim cookie session PHP
}); 

const NotificationComponent = ({ userId }) => {
  useEffect(() => {
    // Join channel notifikasi saat komponen mount
    socket.emit('join_notifications', userId);

    // Dengerin event pengumuman
    socket.on('announcement', (data) => {
        alert(`PENGUMUMAN: ${data.message}`);
    });

    // Cleanup listener saat unmount
    return () => {
        socket.off('announcement');
    };
  }, [userId]);

  return <div>Notification System Active</div>;
};
```

### Skenario Penggunaan

- **Chat**: User A kirim pesan -> Server terima event `send_message` -> Server simpan ke DB -> Server broadcast event `new_message` ke `room_chat_ID`. User B (yang sudah join ke `room_chat_ID`) menerima event `new_message` dan update state chat.
- **Lelang**: User bid -> Server terima event `place_bid` -> Server validasi & update DB -> Server broadcast event `bid_updated` ke `auction_room_ID`. Semua user di halaman lelang tersebut melihat harga terupdate secara instan.

### Tips Penting

- Selalu restart container Node.js (`docker-compose restart node-server`) setiap kali ada perubahan kode di folder `server/` (kecuali sudah setup nodemon dengan volume mapping yang benar).
- Cek log server jika ada error: `docker logs -f nimonspedia-node`.