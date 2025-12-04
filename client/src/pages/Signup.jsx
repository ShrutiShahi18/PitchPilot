import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../api';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { token, user } = await signup(formData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div className="panel" style={{ padding: '32px' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '2rem', fontWeight: '600', color: '#f7f6ff', textAlign: 'center' }}>Create Account</h2>
          <p style={{ margin: '0 0 24px', color: 'rgba(228, 232, 255, 0.8)', textAlign: 'center' }}>Start sending personalized emails to recruiters</p>

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
              <span>Name</span>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
              />
            </div>

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
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn primary"
              style={{ width: '100%', marginTop: '8px' }}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p style={{ margin: '24px 0 0', textAlign: 'center', color: 'rgba(228, 232, 255, 0.8)' }}>
            Already have an account?{' '}
            <button
              onClick={() => navigate('/signin')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#c8b5ff', 
                cursor: 'pointer', 
                fontWeight: '500',
                textDecoration: 'underline'
              }}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

