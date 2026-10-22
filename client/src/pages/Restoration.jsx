import { useState, useEffect } from 'react';
import {
  getRestorations,
  createRestoration,
  updateRestoration,
  verifyRestoration,
  deleteRestoration,
  BACKEND_URL
} from '../api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlinePlus as HiPlus,
  HiOutlinePhoto as HiPhoto,
  HiOutlinePencilSquare as HiEdit,
  HiOutlineXMark as HiClose,
  HiOutlineArrowsPointingOut as HiExpand,
  HiOutlineShieldCheck as HiShield,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineTrash
} from 'react-icons/hi2';
import { SkeletonTable } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';

const RESTORATION_PHOTO_MAP = [
  {
    match: 'agatti',
    before: '/images/restoration/agatti_baseline.jpg',
    after: '/images/restoration/agatti_growth.jpg',
    substrate: 'Elevated Table & Rope Nursery Structure',
    method: 'Micro-fragmentation with cable-tie attachment onto nylon ropes'
  },
  {
    match: 'pirotan',
    before: '/images/restoration/pirotan_baseline.jpg',
    after: '/images/restoration/pirotan_growth.jpg',
    substrate: 'Concrete Artificial Reef Block (AR-03)',
    method: 'Cemented starter nubbins on high-salinity intertidal substrate'
  },
  {
    match: 'havelock',
    before: '/images/restoration/havelock_baseline.jpg',
    after: '/images/restoration/havelock_growth.jpg',
    substrate: 'Anchored Steel Rebar Mesh Grid',
    method: 'Seabed-anchored matrix with individual tag IDs (01–96)'
  },
  {
    match: 'kavaratti',
    before: '/images/restoration/kavaratti_baseline.jpg',
    after: '/images/restoration/kavaratti_growth.jpg',
    substrate: 'Hexagonal Sand-Coated Spider Frame',
    method: 'Lagoon bottom sand-coated steel frame with branching clusters'
  },
  {
    match: 'shingle',
    before: '/images/restoration/shingle_baseline.jpg',
    after: '/images/restoration/shingle_growth.jpg',
    substrate: 'Tiered Pyramid Artificial Reef Module',
    method: 'Multi-level pyramid frame facilitating horizontal table plates'
  },
  {
    match: 'mandapam',
    before: '/images/restoration/mandapam_baseline.jpg',
    after: '/images/restoration/mandapam_growth.jpg',
    substrate: 'Cement Micro-Fragment Discs on Nursery Tray',
    method: 'Elevated nursery mesh tray with calibrated disc propagation'
  }
];

const resolvePhotoUrl = (url, fallback) => {
  if (url && typeof url === 'string' && url.trim().length > 0) {
    if (url.startsWith('http') || url.startsWith('/images/')) return url;
    return `${BACKEND_URL}${url}`;
  }
  return fallback || null;
};

const getPhotoDetails = (item) => {
  if (!item) return { before: null, after: null, substrate: 'Artificial Reef', method: '' };
  const name = (item.siteName || '').toLowerCase();
  const matched = RESTORATION_PHOTO_MAP.find(m => name.includes(m.match));
  return {
    before: resolvePhotoUrl(item.beforePhotoUrl, matched ? matched.before : null),
    after: resolvePhotoUrl(item.afterPhotoUrl, matched ? matched.after : null),
    substrate: matched ? matched.substrate : 'Substrate Framework',
    method: matched ? matched.method : 'Scientific micro-fragment outplanting'
  };
};

export default function Restoration() {
  const { canWrite, isAdmin } = useAuth();
  const [restorations, setRestorations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [photoViewerItem, setPhotoViewerItem] = useState(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);
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

  const handleVerifyRestoration = async (id, status) => {
    try {
      await verifyRestoration(id, status);
      setRestorations(prev => prev.map(r => r._id === id ? { ...r, status } : r));
      setToast({
        message: `Restoration plot ${status === 'verified' ? 'approved & validated' : 'rejected'}. Notification dispatched.`,
        type: status === 'verified' ? 'success' : 'warning'
      });
    } catch (err) {
      setToast({ message: 'Failed to update verification status', type: 'error' });
    }
  };

  const handleDeleteRestoration = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete restoration record "${name}"?`)) {
      return;
    }
    try {
      await deleteRestoration(id);
      setRestorations(prev => prev.filter(r => r._id !== id));
      setToast({ message: `Restoration plot "${name}" permanently deleted.`, type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to delete restoration record', type: 'error' });
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
                <th>Status</th>
                <th>Logged By</th>
                {(canWrite || isAdmin) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {restorations.map((item) => {
                const rate = item.survivalRatePercent;
                const rateClass = rate >= 75 ? 'good' : rate >= 50 ? 'moderate' : 'poor';
                const status = item.status || 'verified';
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
                    <td>
                      {status === 'verified' ? (
                        <span className="badge badge-green">Verified</span>
                      ) : status === 'rejected' ? (
                        <span className="badge badge-coral">Rejected</span>
                      ) : (
                        <span className="badge badge-warning">Pending Review</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--slate-600)' }}>
                      {item.loggedBy?.name || 'Marine Station'}
                    </td>
                    {(canWrite || isAdmin) && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {canWrite && (
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
                          )}

                          {isAdmin && (
                            <>
                              {status !== 'verified' && (
                                <button
                                  className="btn-icon"
                                  style={{ color: '#10b981' }}
                                  onClick={() => handleVerifyRestoration(item._id, 'verified')}
                                  title="Approve Restoration Record"
                                >
                                  <HiOutlineCheckCircle size={17} />
                                </button>
                              )}

                              {status !== 'rejected' && (
                                <button
                                  className="btn-icon"
                                  style={{ color: '#f59e0b' }}
                                  onClick={() => handleVerifyRestoration(item._id, 'rejected')}
                                  title="Reject Restoration Record"
                                >
                                  <HiOutlineXCircle size={17} />
                                </button>
                              )}

                              <button
                                className="btn-icon"
                                style={{ color: '#ef4444' }}
                                onClick={() => handleDeleteRestoration(item._id, item.siteName)}
                                title="Delete Restoration Plot"
                              >
                                <HiOutlineTrash size={16} />
                              </button>
                            </>
                          )}
                        </div>
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
      {photoViewerItem && (() => {
        const details = getPhotoDetails(photoViewerItem);
        const rate = photoViewerItem.survivalRatePercent;
        const rateClass = rate >= 75 ? 'good' : rate >= 50 ? 'moderate' : 'poor';

        return (
          <div className="modal-overlay" onClick={() => setPhotoViewerItem(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '920px', width: '95%' }}>
              <div className="modal-header" style={{ paddingBottom: '12px', borderBottom: '1px solid var(--sand-300)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge badge-teal" style={{ fontWeight: 600 }}>{photoViewerItem.coralSpecies}</span>
                    <span className="badge badge-navy" style={{ fontSize: '11px' }}>{details.substrate}</span>
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--navy-900)' }}>
                    Visual Growth Comparison: {photoViewerItem.siteName}
                  </h2>
                </div>
                <button className="modal-close" onClick={() => setPhotoViewerItem(null)}>
                  <HiClose />
                </button>
              </div>

              <div className="modal-body" style={{ padding: '20px 24px' }}>
                {/* Method info banner */}
                <div style={{
                  background: 'rgba(14, 124, 134, 0.06)',
                  border: '1px solid rgba(14, 124, 134, 0.2)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '12.5px',
                  color: 'var(--navy-800)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HiShield style={{ color: 'var(--teal-600)', flexShrink: 0 }} size={16} />
                    <span><strong>Methodology:</strong> {details.method}</span>
                  </div>
                  <div style={{ color: 'var(--slate-600)' }}>
                    Initial Outplant: <strong>{new Date(photoViewerItem.datePlanted).toLocaleDateString()}</strong>
                  </div>
                </div>

                {/* Side-by-Side Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                  {/* Before Photo Card */}
                  <div style={{
                    border: '1px solid var(--sand-300)',
                    borderRadius: '8px',
                    padding: '12px',
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--navy-800)' }}>
                        Baseline Outplant (T₀)
                      </span>
                      <span className="badge badge-navy" style={{ fontSize: '11px' }}>Baseline</span>
                    </div>

                    {details.before ? (
                      <div
                        style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', borderRadius: '6px' }}
                        onClick={() => setEnlargedPhoto({ url: details.before, title: `Baseline (T₀): ${photoViewerItem.siteName}`, sub: `Species: ${photoViewerItem.coralSpecies} • Outplant: ${new Date(photoViewerItem.datePlanted).toLocaleDateString()}` })}
                        title="Click to view full-resolution photograph"
                      >
                        <img
                          src={details.before}
                          alt="Baseline outplant"
                          style={{
                            width: '100%',
                            height: '240px',
                            objectFit: 'cover',
                            display: 'block',
                            transition: 'transform 0.25s ease'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          background: 'rgba(0,0,0,0.65)',
                          color: '#ffffff',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <HiExpand size={12} /> Inspect
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--sand-200)', borderRadius: '6px', color: 'var(--slate-500)', fontSize: '12px' }}>
                        <HiPhoto size={32} style={{ marginBottom: '8px', color: 'var(--sand-400)' }} />
                        No baseline photograph archived
                      </div>
                    )}
                    <p style={{ fontSize: '11.5px', color: 'var(--slate-600)', margin: '8px 0 0', lineHeight: 1.4 }}>
                      Pre-growth deployment showing micro-fragments anchored to the artificial substrate grid.
                    </p>
                  </div>

                  {/* After Photo Card */}
                  <div style={{
                    border: '1px solid var(--sand-300)',
                    borderRadius: '8px',
                    padding: '12px',
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--navy-800)' }}>
                        Verified Growth (Post-Outplant)
                      </span>
                      <span className="badge badge-green" style={{ fontSize: '11px' }}>
                        Survival: {rate}%
                      </span>
                    </div>

                    {details.after ? (
                      <div
                        style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', borderRadius: '6px' }}
                        onClick={() => setEnlargedPhoto({ url: details.after, title: `Current Growth (${rate}% Survival): ${photoViewerItem.siteName}`, sub: `Species: ${photoViewerItem.coralSpecies} • Canopy Expansion & Ecological Integration` })}
                        title="Click to view full-resolution photograph"
                      >
                        <img
                          src={details.after}
                          alt="Current outplant"
                          style={{
                            width: '100%',
                            height: '240px',
                            objectFit: 'cover',
                            display: 'block',
                            transition: 'transform 0.25s ease'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          background: 'rgba(0,0,0,0.65)',
                          color: '#ffffff',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <HiExpand size={12} /> Inspect
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--sand-200)', borderRadius: '6px', color: 'var(--slate-500)', fontSize: '12px' }}>
                        <HiPhoto size={32} style={{ marginBottom: '8px', color: 'var(--sand-400)' }} />
                        No post-outplant photograph archived
                      </div>
                    )}
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--slate-600)', marginBottom: '3px' }}>
                        <span>Reef Structure Colonization</span>
                        <strong>{rate}% Living Tissue</strong>
                      </div>
                      <div className="progress-bar" style={{ height: '6px' }}>
                        <div className={`progress-fill ${rateClass}`} style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--sand-300)', paddingTop: '12px' }}>
                <button className="btn btn-secondary" onClick={() => setPhotoViewerItem(null)}>Close Comparison</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lightbox Fullscreen Image Zoom */}
      {enlargedPhoto && (
        <div
          className="modal-overlay"
          onClick={() => setEnlargedPhoto(null)}
          style={{ zIndex: 1100, background: 'rgba(10, 25, 35, 0.88)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '1000px',
              width: '90%',
              background: '#0d1d29',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff' }}>{enlargedPhoto.title}</h3>
                <div style={{ fontSize: '12px', color: '#8da2b5', marginTop: '2px' }}>{enlargedPhoto.sub}</div>
              </div>
              <button
                className="btn-icon"
                onClick={() => setEnlargedPhoto(null)}
                style={{ color: '#ffffff', background: 'transparent' }}
              >
                <HiClose size={20} />
              </button>
            </div>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', background: '#07121b' }}>
              <img
                src={enlargedPhoto.url}
                alt="Enlarged coral monitoring record"
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '4px' }}
              />
            </div>
            <div style={{
              padding: '12px 20px',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#0d1d29'
            }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setEnlargedPhoto(null)}>
                Close Preview
              </button>
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
