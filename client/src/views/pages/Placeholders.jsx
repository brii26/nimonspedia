// File sementara untuk export placeholder pages agar App.jsx bersih
// Nanti file ini dihapus setelah file asli di /pages/ dibuat satu per satu

export const AdminLogin = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
      <p className="text-gray-600">Form login akan ada di sini.</p>
    </div>
  </div>
);

export const AdminDashboard = () => (
  <div>
    <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
    <p>User Management & Feature Flags UI here.</p>
  </div>
);

export const AuctionList = () => (
  <div>
    <h2 className="text-2xl font-bold mb-4">Daftar Lelang</h2>
    <p>List auction active & scheduled goes here.</p>
  </div>
);

export const AuctionDetail = () => (
  <div>
    <h2 className="text-2xl font-bold mb-4">Detail Lelang</h2>
    <p>Real-time bidding UI goes here.</p>
  </div>
);

export const ChatPage = () => (
  <div>
    <h2 className="text-2xl font-bold mb-4">Chat Room</h2>
    <p>WebSocket chat UI goes here.</p>
  </div>
);

export const NotFound = () => (
  <div className="text-center mt-20">
    <h1 className="text-4xl font-bold">404</h1>
    <p>Halaman tidak ditemukan.</p>
  </div>
);