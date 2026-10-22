import { useState, useEffect } from 'react';
import { getSurveys, createSurvey, deleteSurvey, verifySurvey, getSites } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowsUpDown,
  HiOutlineTrash,
  HiOutlineMapPin,
  HiOutlinePhoto,
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineInformationCircle
} from 'react-icons/hi2';
import { SkeletonTable } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import SiteDetailModal from '../components/SiteDetailModal';

export default function Surveys() {
  const { user, isAdmin, canWrite } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [availableSites, setAvailableSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState(null);

  // Survey Form State
  const [formData, setFormData] = useState({
    siteId: '',
    location: '',
    region: 'Gulf of Mannar',
    gpsLat: '',
    gpsLng: '',
    depth: '',
    coralCoverPercent: '',
    bleachingPercent: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [photoFile, setPhotoFile] = useState(null);

  const [scopeFilter, setScopeFilter] = useState('all'); // 'all' or 'my'
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchSitesList = async () => {
    try {
      const res = await getSites();
      setAvailableSites(res.data.sites || []);
    } catch (e) {
      console.error('Failed to load sites dropdown:', e);
    }
  };

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        location: search,
        sort: sortField,
        order: sortOrder
      };
      if (regionFilter !== 'all') {
        params.region = regionFilter;
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (scopeFilter === 'my' && user?._id) {
        params.surveyedBy = user._id;
      }
      const res = await getSurveys(params);
      setSurveys(res.data.surveys || []);
    } catch (err) {
      console.error('Failed to fetch surveys:', err);
      setError('Unable to load reef surveys from conservation database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSitesList();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSurveys();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, regionFilter, statusFilter, scopeFilter, sortField, sortOrder]);

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

  const handleSiteSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setFormData(prev => ({
        ...prev,
        siteId: '',
        location: '',
        gpsLat: '',
        gpsLng: ''
      }));
      return;
    }

    const matched = availableSites.find(s => s._id === selectedId);
    if (matched) {
      setFormData(prev => ({
        ...prev,
        siteId: matched._id,
        location: matched.name,
        region: matched.region,
        gpsLat: matched.coordinates.lat,
        gpsLng: matched.coordinates.lng,
        depth: prev.depth || 8
      }));
    }
  };

  const applyLocationPreset = (name, region, lat, lng, depth) => {
    const matched = availableSites.find(s => s.name === name);
    setFormData(prev => ({
      ...prev,
      siteId: matched ? matched._id : '',
      location: name,
      region: region,
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
      if (formData.siteId) data.append('siteId', formData.siteId);
      data.append('location', formData.location);
      data.append('region', formData.region);
      data.append('gpsLat', formData.gpsLat);
      data.append('gpsLng', formData.gpsLng);
      data.append('depth', formData.depth);
      data.append('coralCoverPercent', formData.coralCoverPercent);
      data.append('bleachingPercent', formData.bleachingPercent);
      data.append('date', formData.date);
      if (photoFile) {
        data.append('photo', photoFile);
      }

      await createSurvey(data);
      setToast({ message: 'Reef survey successfully logged and committed to database.', type: 'success' });
      setShowModal(false);
      setFormData({
        siteId: '',
        location: '',
        region: 'Gulf of Mannar',
        gpsLat: '',
        gpsLng: '',
        depth: '',
        coralCoverPercent: '',
        bleachingPercent: '',
        date: new Date().toISOString().split('T')[0]
      });
      setPhotoFile(null);
      fetchSurveys();
      fetchSitesList();
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

  const handleVerifySurvey = async (id, status) => {
    try {
      await verifySurvey(id, status);
      setToast({ message: `Survey marked as ${status.toUpperCase()}`, type: 'success' });
      fetchSurveys();
    } catch (err) {
      setToast({ message: 'Failed to update verification status', type: 'error' });
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Indian Reef Survey Logbook</h1>
          <p>Standardized transect measurements of live coral cover, depth profiles, and thermal bleaching</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <HiOutlinePlus size={18} />
            Log New Survey
          </button>
        )}
      </div>

      {/* Toolbar / Search / Region / Status / Sort */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        {/* Scope Toggle for Researchers */}
        {user?.role === 'researcher' && (
          <div style={{ display: 'flex', background: 'var(--sand-200)', padding: '2px', borderRadius: '6px', border: '1px solid var(--sand-300)' }}>
            <button
              type="button"
              className={`btn btn-sm ${scopeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 10px', fontSize: '12px' }}
              onClick={() => setScopeFilter('all')}
            >
              All Surveys
            </button>
            <button
              type="button"
              className={`btn btn-sm ${scopeFilter === 'my' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 10px', fontSize: '12px' }}
              onClick={() => setScopeFilter('my')}
            >
              My Submissions
            </button>
          </div>
        )}

        <div className="search-input" style={{ flex: '1 1 200px' }}>
          <HiOutlineMagnifyingGlass />
          <input
            type="text"
            placeholder="Search surveys by reef name or reserve..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
        >
          <option value="all">All Regions</option>
          <option value="Gulf of Mannar">Gulf of Mannar</option>
          <option value="Gulf of Kachchh">Gulf of Kachchh</option>
          <option value="Lakshadweep">Lakshadweep</option>
          <option value="Andaman & Nicobar Islands">Andaman & Nicobar</option>
        </select>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Verification Statuses</option>
          <option value="verified">Verified Only</option>
          <option value="pending">Pending Review Only</option>
          <option value="rejected">Rejected Only</option>
        </select>

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
        <SkeletonTable rows={8} cols={8} />
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
                <th>Region</th>
                <th>Status</th>
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
                <th>Site Timeline</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {surveys.map((survey) => {
                const cover = survey.coralCoverPercent;
                const bleaching = survey.bleachingPercent;
                const siteId = survey.siteId?._id || survey.siteId;

                return (
                  <tr key={survey._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{survey.location}</div>
                      {survey.photoUrl && (
                        <div style={{ fontSize: '11px', color: 'var(--teal-600)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <HiOutlinePhoto size={13} /> Photo record attached
                        </div>
                      )}
                    </td>
                    <td>
                      {survey.region ? (
                        <span className="badge badge-navy" style={{ fontSize: '11px' }}>{survey.region}</span>
                      ) : (
                        <span style={{ color: 'var(--slate-400)', fontSize: '12px' }}>India</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${survey.status === 'verified' ? 'badge-teal' : survey.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {survey.status === 'verified' ? 'Verified' : survey.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--slate-600)' }}>
                        {typeof survey.gpsLat === 'number' ? survey.gpsLat.toFixed(3) : '—'}°, {typeof survey.gpsLng === 'number' ? survey.gpsLng.toFixed(3) : '—'}°
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
                      <span className={`badge ${bleaching >= 30 ? 'badge-danger' : bleaching >= 10 ? 'badge-warning' : 'badge-green'}`}>
                        {bleaching}% {bleaching >= 30 ? 'Alert (≥30%)' : bleaching >= 10 ? 'Moderate' : 'Low (<10%)'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        {user?.role === 'public' ? 'Field Station' : (survey.surveyedBy?.name || 'Scientific Team')}
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                      {new Date(survey.date).toLocaleDateString()}
                    </td>
                    <td>
                      {siteId ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 8px' }}
                          onClick={() => setSelectedSiteId(siteId)}
                          title="Inspect site history and restoration timeline"
                        >
                          <HiOutlineEye size={13} /> Site Timeline
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--slate-400)' }}>Unlinked site</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {survey.status === 'pending' && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ backgroundColor: 'var(--teal-500)', color: '#fff', padding: '2px 6px', fontSize: '11px' }}
                              onClick={() => handleVerifySurvey(survey._id, 'verified')}
                              title="Verify survey"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(survey._id)}
                            title="Delete survey record"
                          >
                            <HiOutlineTrash size={15} color="var(--danger)" />
                          </button>
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

      {/* Modal: New Survey Entry */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2>Log Indian Reef Transect Survey</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <HiOutlineXMark />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                
                {/* Indian Reef Quick Presets */}
                <div style={{ marginBottom: '16px', background: 'var(--sand-100)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--sand-300)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--slate-600)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HiOutlineMapPin size={13} /> Quick Indian Reef Presets
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => applyLocationPreset('Gulf of Mannar — Mandapam Reef', 'Gulf of Mannar', 9.280, 79.125, 6.5)}
                    >
                      Mandapam (TN)
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => applyLocationPreset('Lakshadweep — Kavaratti Island Atoll', 'Lakshadweep', 10.567, 72.642, 12.0)}
                    >
                      Kavaratti (LD)
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => applyLocationPreset('Andaman — Havelock Island (Swaraj Dweep) — Elephant Beach', 'Andaman & Nicobar Islands', 12.000, 92.955, 10.5)}
                    >
                      Havelock (AN)
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => applyLocationPreset('Gulf of Kachchh — Pirotan Island Marine National Park', 'Gulf of Kachchh', 22.585, 69.955, 3.5)}
                    >
                      Pirotan (GJ)
                    </button>
                  </div>
                </div>

                {/* Persisted Site Selector */}
                {availableSites.length > 0 && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="siteSelect">Select Registered Monitoring Site (Optional)</label>
                    <select
                      id="siteSelect"
                      className="form-select"
                      value={formData.siteId}
                      onChange={handleSiteSelect}
                    >
                      <option value="">— Or select an existing station —</option>
                      {availableSites.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.region})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label" htmlFor="location">Reef Location / Site Name</label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Gulf of Mannar — Mandapam Reef"
                      value={formData.location}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="region">Region</label>
                    <select
                      id="region"
                      name="region"
                      className="form-select"
                      value={formData.region}
                      onChange={handleFormChange}
                    >
                      <option value="Gulf of Mannar">Gulf of Mannar</option>
                      <option value="Gulf of Kachchh">Gulf of Kachchh</option>
                      <option value="Lakshadweep">Lakshadweep</option>
                      <option value="Andaman & Nicobar Islands">Andaman & Nicobar Islands</option>
                      <option value="Other">Other Region</option>
                    </select>
                  </div>
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
                      placeholder="9.2800"
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
                      placeholder="79.1250"
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
                      placeholder="6.5"
                      value={formData.depth}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="coralCoverPercent">Live Coral Cover % (0-100)</label>
                    <input
                      id="coralCoverPercent"
                      name="coralCoverPercent"
                      type="number"
                      min="0"
                      max="100"
                      required
                      className="form-input"
                      placeholder="45"
                      value={formData.coralCoverPercent}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="bleachingPercent">Bleaching Observed % (0-100)</label>
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
                    <label className="form-label" htmlFor="surveyDate">Observation Date</label>
                    <input
                      id="surveyDate"
                      name="date"
                      type="date"
                      required
                      className="form-input"
                      value={formData.date}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="surveyPhoto">Photographic Record (Optional)</label>
                  <input
                    id="surveyPhoto"
                    type="file"
                    accept="image/*"
                    className="form-input"
                    onChange={(e) => setPhotoFile(e.target.files[0])}
                  />
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

      {/* Selected Site Detail Modal */}
      {selectedSiteId && (
        <SiteDetailModal
          siteId={selectedSiteId}
          onClose={() => setSelectedSiteId(null)}
        />
      )}
    </div>
  );
}
