import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signin } from '../api';

export default function Signin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { token, user } = await signin(formData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div className="panel" style={{ padding: '32px' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '2rem', fontWeight: '600', color: '#f7f6ff', textAlign: 'center' }}>Welcome Back</h2>
          <p style={{ margin: '0 0 24px', color: 'rgba(228, 232, 255, 0.8)', textAlign: 'center' }}>Sign in to continue</p>

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.15)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              color: '#fca5a5', 
              padding: '12px 16px', 
              borderRadius: '12px', 
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="field">
              <span>Email</span>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>

            <div className="field">
              <span>Password</span>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn primary"
              style={{ width: '100%', marginTop: '8px' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ margin: '24px 0 0', textAlign: 'center', color: 'rgba(228, 232, 255, 0.8)' }}>
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#c8b5ff', 
                cursor: 'pointer', 
                fontWeight: '500',
                textDecoration: 'underline'
              }}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

