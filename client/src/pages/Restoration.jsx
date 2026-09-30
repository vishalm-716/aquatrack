import { useState, useEffect } from 'react';
import { getRestorations, createRestoration, updateRestoration } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlinePlus as HiPlus,
  HiOutlinePhoto as HiPhoto,
  HiOutlinePencilSquare as HiEdit,
  HiOutlineXMark as HiClose
} from 'react-icons/hi2';
import { SkeletonTable } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';

export default function Restoration() {
  const { canWrite } = useAuth();
  const [restorations, setRestorations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [photoViewerItem, setPhotoViewerItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New site form
  const [formData, setFormData] = useState({
    siteName: '',
    coralSpecies: '',
    datePlanted: new Date().toISOString().split('T')[0],
    survivalRatePercent: 75
  });
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);

  // Update survival rate form
  const [updateRate, setUpdateRate] = useState(0);

  const fetchRestorations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRestorations();
      setRestorations(res.data.restorations || []);
    } catch (err) {
      console.error('Failed to load restoration logs:', err);
      setError('Unable to retrieve coral restoration registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestorations();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('siteName', formData.siteName);
      data.append('coralSpecies', formData.coralSpecies);
      data.append('datePlanted', formData.datePlanted);
      data.append('survivalRatePercent', formData.survivalRatePercent);
      if (beforeFile) data.append('beforePhoto', beforeFile);
      if (afterFile) data.append('afterPhoto', afterFile);

      await createRestoration(data);
      setToast({ message: 'Coral restoration plot registered successfully.', type: 'success' });
      setShowAddModal(false);
      setFormData({
        siteName: '',
        coralSpecies: '',
        datePlanted: new Date().toISOString().split('T')[0],
        survivalRatePercent: 75
      });
      setBeforeFile(null);
      setAfterFile(null);
      fetchRestorations();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register restoration activity';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('survivalRatePercent', updateRate);
      if (beforeFile) data.append('beforePhoto', beforeFile);
      if (afterFile) data.append('afterPhoto', afterFile);

      await updateRestoration(editingItem._id, data);
      setToast({ message: `Telemetry updated for ${editingItem.siteName}.`, type: 'success' });
      setEditingItem(null);
      setBeforeFile(null);
      setAfterFile(null);
      fetchRestorations();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update restoration record';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Coral Restoration & Nursery Tracker</h1>
          <p>Longitudinal survival monitoring of micro-fragmented outplants and artificial nursery reef structures</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <HiPlus size={18} />
            Register Restoration Plot
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : error ? (
        <div className="card error-state">
          <h3>Data Unavailable</h3>
          <p>{error}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchRestorations}>Retry</button>
        </div>
      ) : restorations.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No restoration plots logged"
            description="Record nursery propagation plots and fragment outplant sites to monitor long-term survivorship."
            actionLabel={canWrite ? "Register First Plot" : undefined}
            onAction={canWrite ? () => setShowAddModal(true) : undefined}
          />
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Restoration Site Name</th>
                <th>Outplanted Coral Taxon</th>
                <th>Planting Date</th>
                <th>Survival Rate %</th>
                <th>Photographic Record</th>
                <th>Logged By</th>
                {canWrite && <th>Update</th>}
              </tr>
            </thead>
            <tbody>
              {restorations.map((item) => {
                const rate = item.survivalRatePercent;
                const rateClass = rate >= 75 ? 'good' : rate >= 50 ? 'moderate' : 'poor';
                return (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--navy-800)' }}>{item.siteName}</div>
                    </td>
                    <td>
                      <span className="badge badge-teal">{item.coralSpecies}</span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--slate-600)' }}>
                      {new Date(item.datePlanted).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ minWidth: '34px', fontSize: '13px' }}>{rate}%</strong>
                        <div className="progress-bar" style={{ width: '80px' }}>
                          <div
                            className={`progress-fill ${rateClass}`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setPhotoViewerItem(item)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <HiPhoto size={14} /> Compare Photos
                      </button>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--slate-600)' }}>
                      {item.loggedBy?.name || 'Marine Station'}
                    </td>
                    {canWrite && (
                      <td>
                        <button
                          className="btn-icon"
                          onClick={() => {
                            setEditingItem(item);
                            setUpdateRate(item.survivalRatePercent);
                          }}
                          title="Update survival telemetry"
                        >
                          <HiEdit size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Side-by-Side Photo Comparison Modal */}
      {photoViewerItem && (
        <div className="modal-overlay" onClick={() => setPhotoViewerItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Chronological Visual Comparison: {photoViewerItem.siteName}</h2>
              <button className="modal-close" onClick={() => setPhotoViewerItem(null)}>
                <HiClose />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Before Photo */}
                <div style={{ border: '1px solid var(--sand-300)', borderRadius: '8px', padding: '12px', background: 'var(--sand-50)' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--navy-800)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Baseline (Pre-Restoration)</span>
                    <span className="badge badge-navy">T₀</span>
                  </div>
                  {photoViewerItem.beforePhotoUrl ? (
                    <img
                      src={photoViewerItem.beforePhotoUrl}
                      alt="Baseline outplant"
                      style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  ) : (
                    <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--sand-200)', borderRadius: '4px', color: 'var(--slate-500)', fontSize: '12px' }}>
                      <HiPhoto size={32} style={{ marginBottom: '8px', color: 'var(--sand-400)' }} />
                      No baseline photograph archived
                    </div>
                  )}
                </div>

                {/* After Photo */}
                <div style={{ border: '1px solid var(--sand-300)', borderRadius: '8px', padding: '12px', background: 'var(--sand-50)' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--navy-800)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Current Growth (Post-Outplant)</span>
                    <span className="badge badge-green">Survival: {photoViewerItem.survivalRatePercent}%</span>
                  </div>
                  {photoViewerItem.afterPhotoUrl ? (
                    <img
                      src={photoViewerItem.afterPhotoUrl}
                      alt="Current outplant"
                      style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  ) : (
                    <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--sand-200)', borderRadius: '4px', color: 'var(--slate-500)', fontSize: '12px' }}>
                      <HiPhoto size={32} style={{ marginBottom: '8px', color: 'var(--sand-400)' }} />
                      No post-outplant photograph archived
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPhotoViewerItem(null)}>Close Comparison</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Survival Rate Modal */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Telemetry: {editingItem.siteName}</h2>
              <button className="modal-close" onClick={() => setEditingItem(null)}>
                <HiClose />
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="survivalRateInput">
                    Current Verified Survival Rate ({updateRate}%)
                  </label>
                  <input
                    id="survivalRateInput"
                    type="range"
                    min="0"
                    max="100"
                    className="form-input"
                    value={updateRate}
                    onChange={(e) => setUpdateRate(parseInt(e.target.value))}
                    style={{ padding: '4px 0' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="updateAfterPhoto">Upload Latest Progression Photograph</label>
                  <input
                    id="updateAfterPhoto"
                    type="file"
                    accept="image/*"
                    className="form-input"
                    onChange={(e) => setAfterFile(e.target.files[0])}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Commit Telemetry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register New Restoration Plot Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Register Restoration Plot</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <HiClose />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="siteName">Plot / Nursery Site Designation</label>
                  <input
                    id="siteName"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Agincourt Nursery — Grid Cell 4"
                    value={formData.siteName}
                    onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="coralSpecies">Propagated Taxon</label>
                    <input
                      id="coralSpecies"
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Acropora cervicornis"
                      value={formData.coralSpecies}
                      onChange={(e) => setFormData({ ...formData, coralSpecies: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="datePlanted">Date Planted</label>
                    <input
                      id="datePlanted"
                      type="date"
                      required
                      className="form-input"
                      value={formData.datePlanted}
                      onChange={(e) => setFormData({ ...formData, datePlanted: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="initialSurvival">Initial Survival Rate %</label>
                  <input
                    id="initialSurvival"
                    type="number"
                    min="0"
                    max="100"
                    required
                    className="form-input"
                    value={formData.survivalRatePercent}
                    onChange={(e) => setFormData({ ...formData, survivalRatePercent: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="beforePhoto">Baseline Photo (T₀)</label>
                    <input
                      id="beforePhoto"
                      type="file"
                      accept="image/*"
                      className="form-input"
                      onChange={(e) => setBeforeFile(e.target.files[0])}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="afterPhoto">Current Photo (T₁)</label>
                    <input
                      id="afterPhoto"
                      type="file"
                      accept="image/*"
                      className="form-input"
                      onChange={(e) => setAfterFile(e.target.files[0])}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Plot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
