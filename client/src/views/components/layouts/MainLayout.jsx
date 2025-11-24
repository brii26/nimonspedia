import { Outlet } from 'react-router-dom';

// Layout untuk Auction dan Chat (Buyer/Seller)
// Bisa ditambahkan Navbar khusus React di sini jika tidak menggunakan Navbar PHP via iframe/integrasi lain
const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;