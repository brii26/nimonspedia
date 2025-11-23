import { Routes, Route, Link, Outlet } from 'react-router-dom';
import { useState } from 'react';

// ==========================================
// 1. COMPONENTS (bisa dihapus kalau udah dipake)
// ==========================================

// --- Area Kerja Person 1 (Admin) ---
const AdminLayout = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Admin Dashboard Area</h1>
      <nav className="flex gap-4 mb-6 border-b pb-4">
        <Link to="/admin/login" className="text-blue-500 hover:underline">Login</Link>
        <Link to="/admin/dashboard" className="text-blue-500 hover:underline">Dashboard</Link>
      </nav>
      {/* Outlet adalah tempat anak-anak route dirender */}
      <div className="bg-gray-50 p-4 border border-dashed border-gray-300 rounded">
        <Outlet />
      </div>
    </div>
  </div>
);

const AdminLogin = () => <div><h2>Form Login Admin (Todo Person 1)</h2></div>;
const AdminDashboard = () => <div><h2>List User & Feature Flag (Todo Person 1)</h2></div>;

// --- Area Kerja Person 2 (Auction) ---
const AuctionHome = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-green-600">Auction Page</h1>
    <p className="mt-2 text-gray-600">Area kerja Person 2. List lelang akan muncul di sini.</p>
  </div>
);

// --- Area Kerja Person 3 (Chat) ---
const ChatHome = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-blue-600">Chat Application</h1>
    <p className="mt-2 text-gray-600">Area kerja Person 3. WebSocket chat akan berjalan di sini.</p>
  </div>
);

// --- Halaman Utama (Navigasi Sementara) ---
const Home = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
    <h1 className="text-4xl font-bold mb-8">React Development Portal</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Card untuk Admin */}
      <Link to="/admin" className="block p-6 bg-red-800 rounded-lg hover:bg-red-700 transition">
        <h2 className="text-xl font-bold mb-2">Admin Panel</h2>
        <p className="text-sm text-gray-300">Person 1 Task</p>
      </Link>

      {/* Card untuk Auction */}
      <Link to="/auction" className="block p-6 bg-green-800 rounded-lg hover:bg-green-700 transition">
        <h2 className="text-xl font-bold mb-2">Auction System</h2>
        <p className="text-sm text-gray-300">Person 2 Task</p>
      </Link>

      {/* Card untuk Chat */}
      <Link to="/chat" className="block p-6 bg-blue-800 rounded-lg hover:bg-blue-700 transition">
        <h2 className="text-xl font-bold mb-2">Chat System</h2>
        <p className="text-sm text-gray-300">Person 3 Task</p>
      </Link>

    </div>
  </div>
);

const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <h1 className="text-4xl font-bold text-gray-800">404</h1>
    <p className="text-gray-600">Halaman tidak ditemukan</p>
    <Link to="/" className="text-blue-500 mt-4 hover:underline">Kembali ke Home</Link>
  </div>
);

// ==========================================
// 2. MAIN APP COMPONENT
// ==========================================

function App() {
  return (
    <Routes>
      {/* Route Utama (Landing Page Dev) */}
      <Route path="/" element={<Home />} />

      {/* Route Group: ADMIN 
        Dikerjakan oleh: Person 1 
      */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<div className="text-gray-500 italic">Pilih menu di atas</div>} />
        <Route path="login" element={<AdminLogin />} />
        <Route path="dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Route Group: AUCTION
        Dikerjakan oleh: Person 2 
      */}
      <Route path="/auction" element={<AuctionHome />} />
      {/* Nanti bisa ditambah: <Route path="/auction/:id" element={<AuctionDetail />} /> */}

      {/* Route Group: CHAT
        Dikerjakan oleh: Person 3 
      */}
      <Route path="/chat" element={<ChatHome />} />

      {/* Fallback 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;