import axios from 'axios';

const api = axios.create({
  baseURL: '/api/node',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;

      if (currentPath.startsWith('/admin') && !currentPath.includes('/login')) {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;