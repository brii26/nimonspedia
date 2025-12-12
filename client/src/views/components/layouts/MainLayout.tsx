import { Outlet } from 'react-router-dom';
import Navbar from '../ui/Navbar.js';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;