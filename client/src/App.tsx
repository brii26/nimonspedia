import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';

import AdminLayout from './views/components/layouts/AdminLayout.js';
import MainLayout from './views/components/layouts/MainLayout.js';

import ProtectedRoute from './services/routes/ProtectedRoute.js';

// Pages
import AdminLogin from './views/pages/admin/Login.js';
import AdminDashboard from './views/pages/admin/Dashboard.js';
import AdminReviews from './views/pages/admin/Reviews.js';
import ChatPage from './views/pages/chat/ChatPage.js'; // Impor ChatPage yang benar

import { 
  AuctionList, 
  AuctionDetail,
  NotFound 
} from './views/pages/Placeholders.js'; 

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* --- ADMIN ROUTES --- */}
        {/* Public Admin Route */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="reviews" element={<AdminReviews />} />
            {/* Redirect /admin root to dashboard */}
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>

        {/* --- USER ROUTES (Auction & Chat) --- */}
        <Route path="/" element={<MainLayout />}>
          <Route path="auction">
            <Route index element={<AuctionList />} />
            <Route path=":id" element={<AuctionDetail />} />
          </Route>
          
          <Route path="chat" element={<ChatPage />} />
        </Route>

        {/* --- FALLBACK --- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;