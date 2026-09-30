import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('researcher');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await registerUser({ name, email, password, role });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(46, 196, 182, 0.15)', color: 'var(--teal-300)', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
            Researcher Enrollment
          </div>
          <h1>Aqua<span>Track</span></h1>
          <p>
            Join regional conservation networks tracking coral health indices, documenting threatened species, and publishing reef recovery data.
          </p>

          <svg className="auth-wave" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60 C 100 20, 150 100, 250 50 C 320 15, 360 80, 400 60 L 400 120 L 0 120 Z" fill="rgba(46, 196, 182, 0.08)" />
            <path d="M0 75 C 80 40, 180 90, 260 65 C 330 40, 370 95, 400 80 L 400 120 L 0 120 Z" fill="rgba(14, 124, 134, 0.12)" />
            <path d="M0 90 C 70 80, 140 100, 220 85 C 300 70, 360 105, 400 95 L 400 120 L 0 120 Z" fill="rgba(11, 46, 61, 0.2)" />
          </svg>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-container">
          <h2>Create Account</h2>
          <div className="auth-subtitle">Register new field researcher or public viewer access</div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(192, 57, 43, 0.1)', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', fontSize: '13px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                required
                className="form-input"
                placeholder="Dr. Samantha Brooks"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                required
                className="form-input"
                placeholder="s.brooks@marine-institute.org"
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
                minLength={6}
                className="form-input"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="role">Account Role</label>
              <select
                id="role"
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="researcher">Field Researcher (Submit Surveys & Restoration Logs)</option>
                <option value="public">Public Viewer (Read-only monitoring access)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              {submitting ? 'Creating Profile...' : 'Complete Registration'}
            </button>
          </form>

          <div className="auth-switch">
            Already have credentials? <Link to="/login">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
