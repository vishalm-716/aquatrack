import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await loginUser({ email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const setDemoCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setToast({ message: `Loaded credentials for: ${demoEmail}`, type: 'warning' });
  };

  return (
    <div className="auth-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="auth-visual">
        <div className="auth-visual-content">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(46, 196, 182, 0.15)', color: 'var(--teal-300)', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
            Internal Operations Portal
          </div>
          <h1>Aqua<span>Track</span></h1>
          <p>
            Centralized marine conservation management platform for scientific field surveys, coral bleaching observation, and reef restoration tracking.
          </p>

          <svg className="auth-wave" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60 C 100 20, 150 100, 250 50 C 320 15, 360 80, 400 60 L 400 120 L 0 120 Z" fill="rgba(46, 196, 182, 0.08)" />
            <path d="M0 75 C 80 40, 180 90, 260 65 C 330 40, 370 95, 400 80 L 400 120 L 0 120 Z" fill="rgba(14, 124, 134, 0.12)" />
            <path d="M0 90 C 70 80, 140 100, 220 85 C 300 70, 360 105, 400 95 L 400 120 L 0 120 Z" fill="rgba(11, 46, 61, 0.2)" />
          </svg>

          <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--slate-400)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            Standard Operating Environment • MERN Conservation Architecture
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-container">
          <h2>Agency Sign In</h2>
          <div className="auth-subtitle">Enter your conservation credentials to access the data workspace</div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(192, 57, 43, 0.1)', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', fontSize: '13px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Official Email Address</label>
              <input
                id="email"
                type="email"
                required
                className="form-input"
                placeholder="name@aquatrack.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              {submitting ? 'Authenticating...' : 'Sign In to Workspace'}
            </button>
          </form>

          {/* Quick Demo Access for Evaluator */}
          <div style={{ marginTop: '24px', padding: '14px', background: '#fff', border: '1px solid var(--sand-300)', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--slate-500)', fontWeight: 600, marginBottom: '8px' }}>
              Quick Evaluation Credentials
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setDemoCredentials('admin@aquatrack.org', 'admin123')}
                style={{ textAlign: 'left', background: 'var(--sand-100)', border: '1px solid var(--sand-300)', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}
              >
                <span><strong>Admin:</strong> admin@aquatrack.org</span>
                <span className="badge badge-coral">Full Access</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('james@aquatrack.org', 'researcher123')}
                style={{ textAlign: 'left', background: 'var(--sand-100)', border: '1px solid var(--sand-300)', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}
              >
                <span><strong>Researcher:</strong> james@aquatrack.org</span>
                <span className="badge badge-teal">Field Ops</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('guest@aquatrack.org', 'guest123')}
                style={{ textAlign: 'left', background: 'var(--sand-100)', border: '1px solid var(--sand-300)', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}
              >
                <span><strong>Public:</strong> guest@aquatrack.org</span>
                <span className="badge badge-navy">Read-Only</span>
              </button>
            </div>
          </div>

          <div className="auth-switch">
            Need an account? <Link to="/register">Register here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
