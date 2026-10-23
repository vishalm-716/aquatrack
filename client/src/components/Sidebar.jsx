import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  HiOutlineShieldCheck,
  HiOutlineClipboardDocumentCheck,
  HiOutlineMap,
  HiOutlineClipboardDocumentList,
  HiOutlineGlobeAmericas,
  HiOutlineSparkles,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineInformationCircle,
  HiOutlineArrowRightOnRectangle
} from 'react-icons/hi2';

export default function Sidebar() {
  const { user, logout, isAdmin, isResearcher } = useAuth();
  const { adminPendingCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const role = user?.role || 'public';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>Aqua<span>Track</span></h2>
        <div className="brand-sub">India Coral Reef Conservation</div>
      </div>

      <nav className="sidebar-nav">
        {/* ================= ADMIN NAVIGATION ================= */}
        {role === 'admin' && (
          <>
            <div className="sidebar-section">
              <div className="sidebar-section-label">Agency Operations</div>
              <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <HiOutlineShieldCheck />
                Command Center
              </NavLink>
              <NavLink to="/admin/verification" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center' }}>
                <HiOutlineClipboardDocumentCheck />
                <span style={{ flex: 1 }}>Verification Queue</span>
                {adminPendingCount > 0 && (
                  <span className="badge badge-warning" style={{ fontSize: '10.5px', padding: '2px 7px', borderRadius: '10px', fontWeight: 700 }}>
                    {adminPendingCount}
                  </span>
                )}
              </NavLink>
              <NavLink to="/map" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <HiOutlineMap />
                India Reef Map
              </NavLink>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-section-label">Field Telemetry</div>
              <NavLink to="/surveys" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <HiOutlineClipboardDocumentList />
                Surveys
              </NavLink>
              <NavLink to="/species" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <HiOutlineGlobeAmericas />
                Biodiversity
              </NavLink>
              <NavLink to="/restoration" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <HiOutlineSparkles />
                Restoration
              </NavLink>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-section-label">System Administration</div>
              <NavLink to="/admin" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <HiOutlineUserGroup />
                User Management
              </NavLink>
              <NavLink to="/admin/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <HiOutlineDocumentText />
                Reports &amp; Audit
              </NavLink>
            </div>
          </>
        )}

        {/* ================= FIELD RESEARCHER NAVIGATION ================= */}
        {role === 'researcher' && (
          <>
            <div className="sidebar-section">
              <div className="sidebar-section-label">Field Operations</div>
              <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <HiOutlineShieldCheck />
                Field Workspace
              </NavLink>
              <NavLink to="/map" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <HiOutlineMap />
                India Reef Map
              </NavLink>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-section-label">Data Logging</div>
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
          </>
        )}

        {/* ================= PUBLIC VIEWER NAVIGATION ================= */}
        {role === 'public' && (
          <>
            <div className="sidebar-section">
              <div className="sidebar-section-label">Public Conservation Portal</div>
              <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <HiOutlineGlobeAmericas />
                India Reef Explorer
              </NavLink>
              <NavLink to="/map" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <HiOutlineMap />
                Explore Map
              </NavLink>
              <NavLink to="/surveys" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <HiOutlineClipboardDocumentList />
                Reef Observations
              </NavLink>
              <NavLink to="/species" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <HiOutlineGlobeAmericas />
                Species Directory
              </NavLink>
              <NavLink to="/restoration" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <HiOutlineSparkles />
                Restoration Overview
              </NavLink>
              <NavLink to="/about" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <HiOutlineInformationCircle />
                About the Data
              </NavLink>
            </div>
          </>
        )}
      </nav>

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role" style={{ textTransform: 'capitalize' }}>{user.role}</div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Sign out">
            <HiOutlineArrowRightOnRectangle size={18} />
          </button>
        </div>
      )}
    </aside>
  );
}
