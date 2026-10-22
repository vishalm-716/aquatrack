import { useState, useEffect } from 'react';
import { getUsers, getUserProfile, updateUserRole, deleteUser, getSurveys, updateSurvey } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineClipboardDocumentCheck,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineMapPin,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineArrowPath
} from 'react-icons/hi2';
import { SkeletonTable } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';

/* ── Role badge helper ── */
function RoleBadge({ role }) {
  const map = {
    admin: { cls: 'badge-teal', label: 'Agency Admin' },
    researcher: { cls: 'badge-navy', label: 'Field Researcher' },
    public: { cls: 'badge-warning', label: 'Public Viewer' },
  };
  const { cls, label } = map[role] || { cls: 'badge-warning', label: role };
  return <span className={`badge ${cls}`}>{label}</span>;
}

/* ── User Profile Modal ── */
function UserProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    getUserProfile(userId)
      .then(res => setProfile(res.data))
      .catch(() => setError('Could not load user profile.'))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '95%' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineUser size={22} color="var(--teal-500)" /> User Profile
          </h2>
          <button className="modal-close" onClick={onClose} title="Close">
            <HiOutlineXMark />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>
              Loading profile…
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>
              {error}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Identity Card */}
              <div style={{
                background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%)',
                borderRadius: '10px',
                padding: '20px 24px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap'
              }}>
                {/* Avatar circle */}
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--teal-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                  border: '3px solid rgba(255,255,255,0.2)'
                }}>
                  {(profile.user.name || 'U').charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ color: '#fff', fontSize: '20px', margin: '0 0 4px 0' }}>
                    {profile.user.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <HiOutlineEnvelope size={13} /> {profile.user.email}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <HiOutlineCalendar size={13} />
                      Joined {new Date(profile.user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <RoleBadge role={profile.user.role} />
                  </div>
                </div>
              </div>

              {/* Stats row */}
              {profile.surveyStats ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                  {[
                    { label: 'Total Surveys', value: profile.surveyStats.total, icon: <HiOutlineChartBar size={18} color="var(--teal-500)" /> },
                    { label: 'Verified', value: profile.surveyStats.verified, icon: <HiOutlineCheckCircle size={18} color="var(--success)" /> },
                    { label: 'Pending', value: profile.surveyStats.pending, icon: <HiOutlineClock size={18} color="var(--warning)" /> },
                    { label: 'Avg Coral Cover', value: `${profile.surveyStats.avgCover}%`, icon: <HiOutlineMapPin size={18} color="var(--navy-600)" /> },
                    { label: 'Avg Bleaching', value: `${profile.surveyStats.avgBleaching}%`, icon: <HiOutlineXCircle size={18} color="var(--coral-500)" /> },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--sand-100)', border: '1px solid var(--sand-300)', borderRadius: '8px', padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>{s.icon}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)' }}>{s.value}</div>
                      <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'var(--sand-100)', borderRadius: '8px', padding: '14px', fontSize: '13px', color: 'var(--slate-500)', textAlign: 'center' }}>
                  No survey submissions found for this user.
                </div>
              )}

              {/* Recent Surveys */}
              {profile.surveys.length > 0 && (
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Recent Survey Transects
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {profile.surveys.slice(0, 6).map(s => (
                      <div key={s._id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'var(--sand-50)', border: '1px solid var(--sand-300)',
                        borderRadius: '6px', padding: '8px 12px', gap: '10px', flexWrap: 'wrap'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--navy-900)' }}>{s.location}</div>
                          <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>
                            {s.region} &bull; {new Date(s.date).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '12px', color: 'var(--teal-600)', fontWeight: 600 }}>{s.coralCoverPercent}% cover</span>
                          <span className={`badge ${s.status === 'verified' ? 'badge-teal' : s.status === 'pending' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                            {s.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Species Sightings */}
              {profile.speciesSightings.length > 0 && (
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Species Sightings Logged
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                    {profile.speciesSightings.map(sp => (
                      <span key={sp._id} className={`badge ${sp.type === 'coral' ? 'badge-teal' : sp.type === 'fish' ? 'badge-navy' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                        {sp.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Restoration */}
              {profile.restorations.length > 0 && (
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Restoration Plots Logged
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {profile.restorations.map(r => (
                      <div key={r._id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'var(--sand-50)', border: '1px solid var(--sand-300)',
                        borderRadius: '6px', padding: '8px 12px', gap: '10px'
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy-900)' }}>{r.siteName}</div>
                        <span className="badge badge-teal" style={{ fontSize: '10px' }}>{r.method}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Main Admin Page
══════════════════════════════════════════════ */
export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [pendingSurveys, setPendingSurveys] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingSurveys, setLoadingSurveys] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [toast, setToast] = useState(null);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await getUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setToast({ message: 'Failed to retrieve user directory', type: 'error' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPendingSurveys = async () => {
    try {
      setLoadingSurveys(true);
      const res = await getSurveys({ limit: 50 });
      const all = res.data.surveys || [];
      setPendingSurveys(all.filter(s => s.status === 'pending'));
    } catch (err) {
      console.error('Error fetching pending surveys:', err);
    } finally {
      setLoadingSurveys(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchPendingSurveys()]);
    setRefreshing(false);
    setToast({ message: 'Data refreshed', type: 'success' });
  };

  useEffect(() => {
    fetchUsers();
    fetchPendingSurveys();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setToast({ message: 'User authorization tier updated.', type: 'success' });
      fetchUsers();
    } catch (err) {
      setToast({ message: 'Failed to update authorization', type: 'error' });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Revoke access and purge this user record?')) return;
    try {
      await deleteUser(userId);
      setToast({ message: 'User record removed from registry.', type: 'warning' });
      fetchUsers();
    } catch (err) {
      setToast({ message: 'Error removing user', type: 'error' });
    }
  };

  const handleVerifySurvey = async (surveyId, status) => {
    try {
      await updateSurvey(surveyId, { status });
      setToast({ message: `Survey marked as ${status}.`, type: 'success' });
      fetchPendingSurveys();
    } catch (err) {
      setToast({ message: 'Failed to update survey status', type: 'error' });
    }
  };

  const nonAdminUsers = users.filter(u => u.role !== 'admin' || u._id === user?._id);

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {viewingUserId && (
        <UserProfileModal userId={viewingUserId} onClose={() => setViewingUserId(null)} />
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Agency Administration &amp; Quality Assurance</h1>
          <p>User access governance, role management, and survey verification</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh all data"
        >
          <HiOutlineArrowPath size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Summary stat pills */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[
          { icon: <HiOutlineUserGroup size={14} />, val: users.length, label: 'Total Users', color: 'var(--navy-700)' },
          { icon: <HiOutlineShieldCheck size={14} />, val: users.filter(u => u.role === 'researcher').length, label: 'Field Researchers', color: 'var(--teal-600)' },
          { icon: <HiOutlineUser size={14} />, val: users.filter(u => u.role === 'public').length, label: 'Public Viewers', color: 'var(--warning)' },
          { icon: <HiOutlineClipboardDocumentCheck size={14} />, val: pendingSurveys.length, label: 'Pending Surveys', color: pendingSurveys.length > 0 ? 'var(--danger)' : 'var(--success)' },
        ].map(item => (
          <div key={item.label} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'var(--sand-100)', border: '1px solid var(--sand-300)',
            borderRadius: '20px', padding: '5px 14px', fontSize: '12px',
            color: item.color, fontWeight: 600
          }}>
            {item.icon} {item.val} {item.label}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--sand-300)', marginBottom: '20px' }}>
        {[
          { id: 'users', icon: <HiOutlineUserGroup size={15} />, label: `Personnel Directory (${users.length})` },
          { id: 'queue', icon: <HiOutlineClipboardDocumentCheck size={15} />, label: `Verification Queue (${pendingSurveys.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px', fontSize: '13px', fontWeight: 500,
              background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--teal-500)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--navy-800)' : 'var(--slate-500)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Users Directory ── */}
      {activeTab === 'users' && (
        loadingUsers ? (
          <SkeletonTable rows={5} cols={5} />
        ) : users.length === 0 ? (
          <EmptyState title="No Users Found" description="No platform users have been registered yet." />
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Researcher / Officer</th>
                    <th>Email Address</th>
                    <th>Current Role</th>
                    <th>Enrolled On</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <button
                          onClick={() => setViewingUserId(u._id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontWeight: 600, color: 'var(--teal-600)', fontSize: '14px',
                            padding: 0, textDecoration: 'underline dotted',
                            display: 'flex', alignItems: 'center', gap: '5px',
                            textAlign: 'left'
                          }}
                          title="View full profile"
                        >
                          <HiOutlineUser size={14} />
                          {u.name}
                        </button>
                        {u._id === user?._id && (
                          <span style={{ fontSize: '10px', color: 'var(--slate-400)', marginLeft: '2px' }}>(you)</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--slate-600)', fontSize: '13px' }}>{u.email}</td>
                      <td>
                        <select
                          className="form-select"
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                          disabled={u._id === user?._id}
                        >
                          <option value="admin">Agency Admin</option>
                          <option value="researcher">Field Researcher</option>
                          <option value="public">Public Viewer</option>
                        </select>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--slate-500)' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '11px', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setViewingUserId(u._id)}
                            title="View profile"
                          >
                            <HiOutlineUser size={12} /> Profile
                          </button>
                          {u._id !== user?._id && (
                            <button
                              className="btn-icon"
                              onClick={() => handleDeleteUser(u._id)}
                              title="Revoke access"
                            >
                              <HiOutlineTrash size={15} color="var(--danger)" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── Tab: Verification Queue ── */}
      {activeTab === 'queue' && (
        loadingSurveys ? (
          <SkeletonTable rows={4} cols={6} />
        ) : pendingSurveys.length === 0 ? (
          <div className="card">
            <EmptyState
              title="Verification Queue Clear"
              description="All submitted reef survey transects have been inspected and verified by QA."
            />
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Survey Location</th>
                  <th>Depth</th>
                  <th>Coral Cover</th>
                  <th>Bleaching</th>
                  <th>Field Researcher</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingSurveys.map((survey) => (
                  <tr key={survey._id}>
                    <td>
                      <strong>{survey.location}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
                        {survey.gpsLat?.toFixed(3)}°, {survey.gpsLng?.toFixed(3)}°
                      </div>
                    </td>
                    <td>{survey.depth} m</td>
                    <td><strong style={{ color: 'var(--teal-600)' }}>{survey.coralCoverPercent}%</strong></td>
                    <td>
                      <span className={`badge ${survey.bleachingPercent >= 30 ? 'badge-danger' : survey.bleachingPercent >= 10 ? 'badge-warning' : 'badge-green'}`}>
                        {survey.bleachingPercent}%
                      </span>
                    </td>
                    <td>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal-600)', fontWeight: 600, fontSize: '13px', padding: 0, textDecoration: 'underline dotted' }}
                        onClick={() => survey.surveyedBy?._id && setViewingUserId(survey.surveyedBy._id)}
                        title="View researcher profile"
                      >
                        {survey.surveyedBy?.name || 'Staff'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleVerifySurvey(survey._id, 'verified')}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                        >
                          <HiOutlineCheck size={13} /> Verify
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleVerifySurvey(survey._id, 'rejected')}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--danger)' }}
                        >
                          <HiOutlineXMark size={13} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
