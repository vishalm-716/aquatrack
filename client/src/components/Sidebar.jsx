import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineChartBarSquare,
  HiOutlineClipboardDocumentList,
  HiOutlineGlobeAmericas,
  HiOutlineSparkles,
  HiOutlineUserGroup,
  HiOutlineArrowRightOnRectangle
} from 'react-icons/hi2';

export default function Sidebar() {
  const { user, logout, isAdmin, canWrite } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>Aqua<span>Track</span></h2>
        <div className="brand-sub">Marine Conservation Platform</div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-label">Overview</div>
          <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <HiOutlineChartBarSquare />
            Dashboard
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Field Data</div>
          <NavLink to="/surveys" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <HiOutlineClipboardDocumentList />
            Reef Surveys
          </NavLink>
          <NavLink to="/species" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <HiOutlineGlobeAmericas />
            Biodiversity Records
          </NavLink>
          <NavLink to="/restoration" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <HiOutlineSparkles />
            Restoration Tracker
          </NavLink>
        </div>

        {isAdmin && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">Administration</div>
            <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <HiOutlineUserGroup />
              User Management
            </NavLink>
          </div>
        )}
      </nav>

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role}</div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Sign out">
            <HiOutlineArrowRightOnRectangle size={18} />
          </button>
        </div>
      )}
    </aside>
  );
}
