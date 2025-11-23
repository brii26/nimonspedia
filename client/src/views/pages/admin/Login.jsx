import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Alert } from '../../components/ui';
import { useAuth } from '../../../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginAdmin(formData.email, formData.password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <section className="auth-card">
        <header className="auth-header">
          <h1>Admin Login</h1>
          <p>Access administrator dashboard</p>
        </header>
        
        {error && (
          <Alert variant="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
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
          
          <div className="form-group">
            <div className="password-input-container">
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
                className="password-toggle" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                <img 
                  src={showPassword ? '/assets/icons/eye-off.svg' : '/assets/icons/eye.svg'} 
                  alt={showPassword ? 'Hide password' : 'Show password'} 
                />
              </button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            variant="primary" 
            className="btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        
        <nav className="auth-nav">
          <p><a href="/" className="btn-link">← Back to Main Site</a></p>
        </nav>
      </section>
    </div>
  );
};

export default Login;