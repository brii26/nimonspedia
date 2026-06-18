import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.js';

const AdminLayout = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Sederhana */}
      <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-[#42b549]">NimonAdmin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            to="/admin/dashboard" 
            className={`block p-3 rounded ${isActive('/admin/dashboard') ? 'bg-[#edfef0] text-[#42b549]' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/admin/reviews" 
            className={`block p-3 rounded ${isActive('/admin/reviews') ? 'bg-[#edfef0] text-[#42b549]' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Reviews
          </Link>
        </nav>
        <div className="p-4 border-t">
          <button 
            onClick={logout}
            className="w-full text-left p-3 text-red-600 hover:bg-red-50 rounded"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;