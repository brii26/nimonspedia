import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

const ProtectedRoute = () => {
  const { admin, loading } = useAuth();

  if (loading) return <div className="p-4">Loading authentication...</div>;

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;