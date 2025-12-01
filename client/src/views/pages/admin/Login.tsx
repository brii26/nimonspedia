import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChangeEvent, FormEvent } from 'react';
import { Button, Input, Alert } from '../../components/ui/index.js';
import { useAuth } from '../../../context/AuthContext.js';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginAdmin(formData.email, formData.password);
      navigate('/admin/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-4">
      <section className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-600">Access administrator dashboard</p>
        </header>
        
        {error && (
          <Alert variant="error" onClose={() => setError('')} className="mb-6">
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <Input
              label="Email Address"
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
          
          <div>
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className="absolute right-3 top-[42px] text-gray-400 hover:text-gray-600 transition-colors" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                <img 
                  src={showPassword ? '/assets/icons/eye-off.svg' : '/assets/icons/eye.svg'} 
                  alt={showPassword ? 'Hide password' : 'Show password'}
                  className="w-5 h-5"
                />
              </button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        
        <nav className="mt-6 text-center">
          <p>
            <a href="/" className="text-[#667eea] hover:text-[#5a67d8] font-medium transition-colors inline-flex items-center gap-1">
              ← Back to Main Site
            </a>
          </p>
        </nav>
      </section>
    </div>
  );
};

export default Login;