import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import WelcomeCard from './WelcomeCard';
import NotificationBell from './NotificationBell';

export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <header className="app-topbar" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 28px',
          borderBottom: '1px solid var(--sand-300)',
          background: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 90
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--navy-800)' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <strong>Indian EEZ Coral Telemetry Network</strong>
            <span style={{ color: 'var(--slate-300)' }}>•</span>
            <span style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Database: MongoDB Atlas (Cloud Cluster)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <NotificationBell />
            <div style={{ fontSize: '12px', color: 'var(--slate-600)', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{user.name}</div>
                <div style={{ textTransform: 'capitalize', fontSize: '11px', color: 'var(--teal-600)', fontWeight: 500 }}>
                  {user.role === 'admin' ? 'Agency Administrator' : user.role === 'researcher' ? 'Field Marine Researcher' : 'Public Viewer'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="page-content" style={{ padding: '24px 28px' }}>
          <WelcomeCard />
          <Outlet />
        </div>
      </main>
    </div>
  );
}


export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children || <Outlet />;
}
