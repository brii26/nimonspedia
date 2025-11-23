import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import AdminLayout from './views/components/layouts/AdminLayout';
import MainLayout from './views/components/layouts/MainLayout';

import ProtectedRoute from './services/routes/ProtectedRoute';

// Pages (Placeholder)
import { 
  AdminLogin, 
  AdminDashboard, 
  AuctionList, 
  AuctionDetail, 
  ChatPage, 
  NotFound 
} from './pages/Placeholders'; 

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* --- ADMIN ROUTES --- */}
          <Route path="/admin">
            {/* Public Admin Route */}
            <Route path="login" element={<AdminLogin />} />

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                {/* Redirect /admin root to dashboard */}
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
              </Route>
            </Route>
          </Route>

          {/* --- USER ROUTES (Auction & Chat) --- */}
          <Route element={<MainLayout />}>
            <Route path="/auction">
              <Route index element={<AuctionList />} />
              <Route path=":id" element={<AuctionDetail />} />
            </Route>
            
            <Route path="/chat" element={<ChatPage />} />
          </Route>

          {/* --- FALLBACK --- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;