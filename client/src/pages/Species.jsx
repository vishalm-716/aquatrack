import { useState, useEffect } from 'react';
import { getSpecies, createSpecies } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineEye,
  HiOutlineXMark,
  HiOutlineTag,
  HiOutlineMapPin,
  HiOutlineCalendar
} from 'react-icons/hi2';
import { SkeletonTable } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';

export default function Species() {
  const { canWrite } = useAuth();
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [newRecord, setNewRecord] = useState({
    name: '',
    type: 'coral',
    location: '',
    count: 1,
    sightingDate: new Date().toISOString().split('T')[0]
  });

  const fetchSpecies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSpecies({
        search,
        type: typeFilter
      });
      setSpeciesList(res.data.species || []);
    } catch (err) {
      console.error('Failed to fetch species records:', err);
      setError('Unable to query marine biodiversity register.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSpecies();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, typeFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createSpecies(newRecord);
      setToast({ message: 'Species observation successfully cataloged.', type: 'success' });
      setShowAddModal(false);
      setNewRecord({
        name: '',
        type: 'coral',
        location: '',
        count: 1,
        sightingDate: new Date().toISOString().split('T')[0]
      });
      fetchSpecies();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error adding species';
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
          <h1>Marine Biodiversity Register</h1>
          <p>Scientific observation log for coral taxa, ichthyofauna, and benthic invertebrates</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <HiOutlinePlus size={18} />
            Log Specimen Sighting
          </button>
        )}
      </div>

      {/* Toolbar / Filters */}
      <div className="toolbar">
        <div className="search-input">
          <HiOutlineMagnifyingGlass />
          <input
            type="text"
            placeholder="Search by species taxon name or observation location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Taxonomic Categories</option>
          <option value="coral">Scleractinia (Corals)</option>
          <option value="fish">Ichthyofauna (Fish)</option>
          <option value="invertebrate">Benthic Invertebrates</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : error ? (
        <div className="card error-state">
          <h3>Register Unavailable</h3>
          <p>{error}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchSpecies}>Retry</button>
        </div>
      ) : speciesList.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No biodiversity observations found"
            description={search || typeFilter ? "No taxa match your search criteria. Clear filters to view full catalog." : "No sightings cataloged yet."}
            actionLabel={canWrite ? "Log First Sighting" : undefined}
            onAction={canWrite ? () => setShowAddModal(true) : undefined}
          />
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Taxon Scientific / Common Name</th>
                <th>Category</th>
                <th>Location</th>
                <th>Specimen Count</th>
                <th>Observation Date</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {speciesList.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--navy-800)' }}>{item.name}</div>
                  </td>
                  <td>
                    <span className={`badge ${item.type === 'coral' ? 'badge-teal' : item.type === 'fish' ? 'badge-navy' : 'badge-coral'}`}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ color: 'var(--slate-700)' }}>{item.location}</td>
                  <td>
                    <strong style={{ fontSize: '14px' }}>{item.count}</strong> observed
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--slate-500)' }}>
                    {new Date(item.sightingDate).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn-icon"
                      onClick={() => setSelectedSpecies(item)}
                      title="Inspect taxonomic record"
                    >
                      <HiOutlineEye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal / Drawer */}
      {selectedSpecies && (
        <div className="modal-overlay" onClick={() => setSelectedSpecies(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Specimen Record</h2>
              <button className="modal-close" onClick={() => setSelectedSpecies(null)}>
                <HiOutlineXMark />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '16px', background: 'var(--sand-50)', borderRadius: '8px', border: '1px solid var(--sand-300)', marginBottom: '16px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--navy-800)', fontFamily: 'var(--font-heading)' }}>
                  {selectedSpecies.name}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <span className={`badge ${selectedSpecies.type === 'coral' ? 'badge-teal' : selectedSpecies.type === 'fish' ? 'badge-navy' : 'badge-coral'}`}>
                    {selectedSpecies.type.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <div style={{ color: 'var(--slate-500)', fontSize: '11px', textTransform: 'uppercase' }}>Habitat Location</div>
                  <div style={{ fontWeight: 500, marginTop: '2px', color: 'var(--slate-800)' }}>{selectedSpecies.location}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--slate-500)', fontSize: '11px', textTransform: 'uppercase' }}>Specimens Observed</div>
                  <div style={{ fontWeight: 500, marginTop: '2px', color: 'var(--slate-800)' }}>{selectedSpecies.count} count</div>
                </div>
                <div>
                  <div style={{ color: 'var(--slate-500)', fontSize: '11px', textTransform: 'uppercase' }}>Date Observed</div>
                  <div style={{ fontWeight: 500, marginTop: '2px', color: 'var(--slate-800)' }}>
                    {new Date(selectedSpecies.sightingDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--slate-500)', fontSize: '11px', textTransform: 'uppercase' }}>Associated Transect</div>
                  <div style={{ fontWeight: 500, marginTop: '2px', color: 'var(--slate-800)' }}>
                    {selectedSpecies.linkedSurvey?.location || 'Direct sighting entry'}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedSpecies(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sighting Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Catalog Specimen Sighting</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <HiOutlineXMark />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="specimenName">Taxonomic Name (Scientific / Common)</label>
                  <input
                    id="specimenName"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Acropora millepora or Clownfish"
                    value={newRecord.name}
                    onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="specimenType">Category</label>
                    <select
                      id="specimenType"
                      className="form-select"
                      value={newRecord.type}
                      onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
                    >
                      <option value="coral">Scleractinia (Coral)</option>
                      <option value="fish">Ichthyofauna (Fish)</option>
                      <option value="invertebrate">Benthic Invertebrate</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="specimenCount">Count Observed</label>
                    <input
                      id="specimenCount"
                      type="number"
                      min="1"
                      required
                      className="form-input"
                      value={newRecord.count}
                      onChange={(e) => setNewRecord({ ...newRecord, count: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="specimenLocation">Observation Location</label>
                  <input
                    id="specimenLocation"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Coral Triangle — Raja Ampat"
                    value={newRecord.location}
                    onChange={(e) => setNewRecord({ ...newRecord, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="specimenDate">Observation Date</label>
                  <input
                    id="specimenDate"
                    type="date"
                    required
                    className="form-input"
                    value={newRecord.sightingDate}
                    onChange={(e) => setNewRecord({ ...newRecord, sightingDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Catalog Observation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
