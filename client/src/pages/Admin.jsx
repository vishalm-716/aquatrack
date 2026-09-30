import { useState, useEffect } from 'react';
import { getUsers, updateUserRole, deleteUser, getSurveys, updateSurvey } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineClipboardDocumentCheck
} from 'react-icons/hi2';
import { SkeletonTable } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [pendingSurveys, setPendingSurveys] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingSurveys, setLoadingSurveys] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [toast, setToast] = useState(null);

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
      // Filter for surveys with pending or recent status
      const all = res.data.surveys || [];
      const pending = all.filter(s => s.status === 'pending');
      setPendingSurveys(pending);
    } catch (err) {
      console.error('Error fetching pending surveys:', err);
    } finally {
      setLoadingSurveys(false);
    }
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

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <h1>Agency Administration & Quality Assurance</h1>
        <p>User access governance and survey verification queue</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--sand-300)', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'users' ? '2px solid var(--teal-500)' : '2px solid transparent',
            color: activeTab === 'users' ? 'var(--navy-800)' : 'var(--slate-500)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HiOutlineUserGroup size={16} />
            <span>Personnel Directory ({users.length})</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'queue' ? '2px solid var(--teal-500)' : '2px solid transparent',
            color: activeTab === 'queue' ? 'var(--navy-800)' : 'var(--slate-500)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HiOutlineClipboardDocumentCheck size={16} />
            <span>Verification Queue ({pendingSurveys.length})</span>
          </div>
        </button>
      </div>

      {/* Tab: Users Directory */}
      {activeTab === 'users' && (
        loadingUsers ? (
          <SkeletonTable rows={5} cols={5} />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Researcher / Officer</th>
                  <th>Email Address</th>
                  <th>Current Role</th>
                  <th>Enrolled On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--navy-800)' }}>{u.name}</div>
                    </td>
                    <td style={{ color: 'var(--slate-600)' }}>{u.email}</td>
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
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {u._id !== user?._id && (
                        <button
                          className="btn-icon"
                          onClick={() => handleDeleteUser(u._id)}
                          title="Purge user credentials"
                        >
                          <HiOutlineTrash size={15} color="var(--danger)" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Tab: Verification Queue */}
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
                        {survey.gpsLat.toFixed(3)}°, {survey.gpsLng.toFixed(3)}°
                      </div>
                    </td>
                    <td>{survey.depth} m</td>
                    <td>{survey.coralCoverPercent}%</td>
                    <td>
                      <span className={`badge ${survey.bleachingPercent > 20 ? 'badge-coral' : 'badge-green'}`}>
                        {survey.bleachingPercent}%
                      </span>
                    </td>
                    <td>{survey.surveyedBy?.name || 'Staff'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleVerifySurvey(survey._id, 'verified')}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <HiOutlineCheck size={14} /> Verify
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleVerifySurvey(survey._id, 'rejected')}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)' }}
                        >
                          <HiOutlineXMark size={14} /> Reject
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
