import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const AdminLayout = () => {
  const { logoutAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Sederhana */}
      <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">NimonAdmin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            to="/admin/dashboard" 
            className={`block p-3 rounded ${isActive('/admin/dashboard') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Dashboard
          </Link>
          {/* Tambahkan menu lain jika perlu */}
        </nav>
        <div className="p-4 border-t">
          <button 
            onClick={logoutAdmin}
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