import { useState, useEffect } from 'react';
import { getSurveys, createSurvey, deleteSurvey } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowsUpDown,
  HiOutlineTrash,
  HiOutlineMapPin,
  HiOutlinePhoto,
  HiOutlineXMark
} from 'react-icons/hi2';
import { SkeletonTable } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';

export default function Surveys() {
  const { user, isAdmin, canWrite } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Survey Form State
  const [formData, setFormData] = useState({
    location: '',
    gpsLat: '',
    gpsLng: '',
    depth: '',
    coralCoverPercent: '',
    bleachingPercent: ''
  });
  const [photoFile, setPhotoFile] = useState(null);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSurveys({
        location: search,
        sort: sortField,
        order: sortOrder
      });
      setSurveys(res.data.surveys || []);
    } catch (err) {
      console.error('Failed to fetch surveys:', err);
      setError('Unable to load reef surveys from conservation database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSurveys();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const applyLocationPreset = (name, lat, lng, depth) => {
    setFormData(prev => ({
      ...prev,
      location: name,
      gpsLat: lat,
      gpsLng: lng,
      depth: depth
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('location', formData.location);
      data.append('gpsLat', formData.gpsLat);
      data.append('gpsLng', formData.gpsLng);
      data.append('depth', formData.depth);
      data.append('coralCoverPercent', formData.coralCoverPercent);
      data.append('bleachingPercent', formData.bleachingPercent);
      if (photoFile) {
        data.append('photo', photoFile);
      }

      await createSurvey(data);
      setToast({ message: 'Reef survey successfully logged and committed to database.', type: 'success' });
      setShowModal(false);
      setFormData({
        location: '',
        gpsLat: '',
        gpsLng: '',
        depth: '',
        coralCoverPercent: '',
        bleachingPercent: ''
      });
      setPhotoFile(null);
      fetchSurveys();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error logging survey';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirm deletion of this official survey record?')) return;
    try {
      await deleteSurvey(id);
      setToast({ message: 'Survey record deleted', type: 'warning' });
      fetchSurveys();
    } catch (err) {
      setToast({ message: 'Failed to delete survey', type: 'error' });
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Reef Survey Logbook</h1>
          <p>Standardized transect measurements of substrate health, depth gradients, and thermal bleaching</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <HiOutlinePlus size={18} />
            Log New Survey
          </button>
        )}
      </div>

      {/* Toolbar / Search / Sort */}
      <div className="toolbar">
        <div className="search-input">
          <HiOutlineMagnifyingGlass />
          <input
            type="text"
            placeholder="Search surveys by reef name or marine reserve..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
        >
          <option value="date">Sort by Survey Date</option>
          <option value="coralCoverPercent">Sort by Coral Cover %</option>
          <option value="bleachingPercent">Sort by Bleaching %</option>
          <option value="depth">Sort by Depth (m)</option>
          <option value="location">Sort by Location</option>
        </select>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          title="Toggle sort direction"
        >
          <HiOutlineArrowsUpDown size={14} />
          {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        </button>
      </div>

      {/* Table Data View */}
      {loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : error ? (
        <div className="card error-state">
          <h3>Data Retrieval Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchSurveys}>Retry</button>
        </div>
      ) : surveys.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No survey transects found"
            description={search ? `No surveys match "${search}". Try adjusting your search query.` : 'No surveys logged in the database yet.'}
            actionLabel={canWrite ? "Log Initial Survey" : undefined}
            onAction={canWrite ? () => setShowModal(true) : undefined}
          />
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('location')} className={sortField === 'location' ? 'sorted' : ''}>
                  Survey Site / Location {sortField === 'location' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>GPS Coordinates</th>
                <th onClick={() => handleSort('depth')} className={sortField === 'depth' ? 'sorted' : ''}>
                  Depth {sortField === 'depth' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('coralCoverPercent')} className={sortField === 'coralCoverPercent' ? 'sorted' : ''}>
                  Coral Cover % {sortField === 'coralCoverPercent' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('bleachingPercent')} className={sortField === 'bleachingPercent' ? 'sorted' : ''}>
                  Bleaching % {sortField === 'bleachingPercent' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Surveyor</th>
                <th onClick={() => handleSort('date')} className={sortField === 'date' ? 'sorted' : ''}>
                  Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {surveys.map((survey) => {
                const cover = survey.coralCoverPercent;
                const bleaching = survey.bleachingPercent;
                return (
                  <tr key={survey._id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--navy-800)' }}>{survey.location}</div>
                      {survey.photoUrl && (
                        <div style={{ fontSize: '11px', color: 'var(--teal-600)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <HiOutlinePhoto size={13} /> Photo record attached
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--slate-600)' }}>
                        {survey.gpsLat.toFixed(3)}°, {survey.gpsLng.toFixed(3)}°
                      </span>
                    </td>
                    <td>{survey.depth} m</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, minWidth: '32px' }}>{cover}%</span>
                        <div className="progress-bar" style={{ width: '60px' }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${cover}%`,
                              backgroundColor: cover > 60 ? 'var(--teal-500)' : cover > 35 ? 'var(--warning)' : 'var(--coral-500)'
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${bleaching > 30 ? 'badge-danger' : bleaching > 15 ? 'badge-coral' : 'badge-green'}`}>
                        {bleaching}% {bleaching > 30 ? 'Severe' : bleaching > 15 ? 'Moderate' : 'Low'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>{survey.surveyedBy?.name || 'Scientific Team'}</div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                      {new Date(survey.date).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${survey.status === 'verified' ? 'badge-teal' : 'badge-warning'}`}>
                        {survey.status || 'verified'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(survey._id)}
                          title="Delete survey record"
                        >
                          <HiOutlineTrash size={15} color="var(--danger)" />
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

      {/* Modal: New Survey Entry */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Log Reef Transect Survey</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <HiOutlineXMark />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Location Presets for Field Rapid Entry */}
                <div style={{ marginBottom: '16px', background: 'var(--sand-100)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--sand-300)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--slate-600)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HiOutlineMapPin size={13} /> Quick Coordinate Presets
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => applyLocationPreset('Great Barrier Reef — Agincourt Reef', -16.03, 145.85, 12)}
                    >
                      Agincourt Reef
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => applyLocationPreset('Seychelles — Aldabra Atoll', -9.42, 46.33, 9)}
                    >
                      Aldabra Atoll
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => applyLocationPreset('Galapagos — Wolf Island Reef', 1.38, -91.82, 16)}
                    >
                      Wolf Island
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="location">Reef Location / Marine Protected Area</label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Great Barrier Reef — Agincourt Reef #4"
                    value={formData.location}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="gpsLat">GPS Latitude (-90 to +90)</label>
                    <input
                      id="gpsLat"
                      name="gpsLat"
                      type="number"
                      step="0.0001"
                      required
                      className="form-input"
                      placeholder="-16.0300"
                      value={formData.gpsLat}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="gpsLng">GPS Longitude (-180 to +180)</label>
                    <input
                      id="gpsLng"
                      name="gpsLng"
                      type="number"
                      step="0.0001"
                      required
                      className="form-input"
                      placeholder="145.8500"
                      value={formData.gpsLng}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="depth">Transect Depth (meters)</label>
                    <input
                      id="depth"
                      name="depth"
                      type="number"
                      min="0"
                      max="300"
                      step="0.5"
                      required
                      className="form-input"
                      placeholder="12.0"
                      value={formData.depth}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="coralCoverPercent">Live Coral Cover %</label>
                    <input
                      id="coralCoverPercent"
                      name="coralCoverPercent"
                      type="number"
                      min="0"
                      max="100"
                      required
                      className="form-input"
                      placeholder="58"
                      value={formData.coralCoverPercent}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="bleachingPercent">Bleaching Observed %</label>
                    <input
                      id="bleachingPercent"
                      name="bleachingPercent"
                      type="number"
                      min="0"
                      max="100"
                      required
                      className="form-input"
                      placeholder="12"
                      value={formData.bleachingPercent}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="surveyPhoto">Transect Photographic Record</label>
                    <input
                      id="surveyPhoto"
                      type="file"
                      accept="image/*"
                      className="form-input"
                      onChange={(e) => setPhotoFile(e.target.files[0])}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting Transect Data...' : 'Commit Survey Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
