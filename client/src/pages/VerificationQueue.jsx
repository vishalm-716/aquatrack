import React, { useState, useEffect } from 'react';
import {
  getVerificationQueue,
  getSurveys,
  getSpecies,
  getRestorations,
  verifySurvey,
  verifySpecies,
  verifyRestoration,
  BACKEND_URL
} from '../api';
import {
  HiOutlineClipboardDocumentCheck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowPath,
  HiOutlinePhoto,
  HiOutlineExclamationTriangle,
  HiOutlineEye
} from 'react-icons/hi2';
import Toast from '../components/Toast';
import EmptyState from '../components/EmptyState';

export default function VerificationQueue() {
  const [queue, setQueue] = useState({
    surveys: [],
    species: [],
    restorations: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'survey' | 'species' | 'restoration'
  const [toast, setToast] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      // Try unified verification-queue endpoint first
      try {
        const res = await getVerificationQueue();
        setQueue({
          surveys: res.data.surveys || [],
          species: res.data.species || [],
          restorations: res.data.restorations || []
        });
        return;
      } catch (err) {
        console.warn('Unified verification queue endpoint unavailable, fetching in parallel:', err);
      }

      // Parallel fallback
      const [surveysRes, speciesRes, restorationsRes] = await Promise.all([
        getSurveys({ status: 'pending' }).catch(() => ({ data: { surveys: [] } })),
        getSpecies({ status: 'pending' }).catch(() => ({ data: { species: [] } })),
        getRestorations({ status: 'pending' }).catch(() => ({ data: { restorations: [] } }))
      ]);

      setQueue({
        surveys: surveysRes.data.surveys || [],
        species: speciesRes.data.species || [],
        restorations: restorationsRes.data.restorations || []
      });
    } catch (err) {
      console.error('Failed to load verification queue:', err);
      setToast({ type: 'error', message: 'Unable to retrieve pending verification records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (category, id, status, title) => {
    try {
      setProcessingId(id);
      if (category === 'survey') {
        await verifySurvey(id, status);
        setQueue(prev => ({
          ...prev,
          surveys: prev.surveys.filter(s => s._id !== id)
        }));
      } else if (category === 'species') {
        await verifySpecies(id, status);
        setQueue(prev => ({
          ...prev,
          species: prev.species.filter(s => s._id !== id)
        }));
      } else if (category === 'restoration') {
        await verifyRestoration(id, status);
        setQueue(prev => ({
          ...prev,
          restorations: prev.restorations.filter(r => r._id !== id)
        }));
      }

      const actionText = status === 'verified' ? 'Approved & Validated' : 'Rejected';
      setToast({
        type: status === 'verified' ? 'success' : 'warning',
        message: `${title ? `"${title}"` : 'Record'} marked as ${actionText}. Notification dispatched to researcher.`
      });
    } catch (err) {
      console.error('Failed to update verification status:', err);
      setToast({
        type: 'error',
        message: 'Failed to update verification status'
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Combine and format all items
  const surveyItems = queue.surveys.map(s => ({
    ...s,
    _category: 'survey',
    _title: s.location,
    _date: s.date || s.createdAt,
    _user: s.surveyedBy
  }));

  const speciesItems = queue.species.map(s => ({
    ...s,
    _category: 'species',
    _title: s.name,
    _date: s.sightingDate || s.createdAt,
    _user: s.recordedBy
  }));

  const restorationItems = queue.restorations.map(r => ({
    ...r,
    _category: 'restoration',
    _title: r.siteName,
    _date: r.datePlanted || r.createdAt,
    _user: r.loggedBy
  }));

  const totalPending = surveyItems.length + speciesItems.length + restorationItems.length;

  let displayedItems = [];
  if (activeTab === 'all') {
    displayedItems = [...surveyItems, ...speciesItems, ...restorationItems].sort(
      (a, b) => new Date(b._date) - new Date(a._date)
    );
  } else if (activeTab === 'survey') {
    displayedItems = surveyItems;
  } else if (activeTab === 'species') {
    displayedItems = speciesItems;
  } else if (activeTab === 'restoration') {
    displayedItems = restorationItems;
  }

  return (
    <div>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Scientific Verification Queue</h1>
          <p>
            Review and validate incoming transect surveys, biodiversity sightings, and restoration nursery plots logged by scientific researchers across Indian coral reefs.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchQueue} title="Refresh verification queue" disabled={loading}>
          <HiOutlineArrowPath size={14} className={loading ? 'spin' : ''} /> Refresh Queue
        </button>
      </div>

      {/* Category Tabs / Metrics */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('all')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          All Pending Submissions
          <span className="badge" style={{ background: activeTab === 'all' ? 'rgba(255,255,255,0.25)' : 'var(--sand-300)', color: activeTab === 'all' ? '#fff' : 'var(--navy-900)', fontSize: '11px', padding: '2px 6px' }}>
            {totalPending}
          </span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'survey' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('survey')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          Reef Transect Surveys
          <span className="badge" style={{ background: activeTab === 'survey' ? 'rgba(255,255,255,0.25)' : 'var(--sand-300)', color: activeTab === 'survey' ? '#fff' : 'var(--navy-900)', fontSize: '11px', padding: '2px 6px' }}>
            {surveyItems.length}
          </span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'species' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('species')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          Biodiversity Records
          <span className="badge" style={{ background: activeTab === 'species' ? 'rgba(255,255,255,0.25)' : 'var(--sand-300)', color: activeTab === 'species' ? '#fff' : 'var(--navy-900)', fontSize: '11px', padding: '2px 6px' }}>
            {speciesItems.length}
          </span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'restoration' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('restoration')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          Restoration Plots
          <span className="badge" style={{ background: activeTab === 'restoration' ? 'rgba(255,255,255,0.25)' : 'var(--sand-300)', color: activeTab === 'restoration' ? '#fff' : 'var(--navy-900)', fontSize: '11px', padding: '2px 6px' }}>
            {restorationItems.length}
          </span>
        </button>
      </div>

      {/* Queue Body */}
      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          Loading pending submissions across all data loggings...
        </div>
      ) : totalPending === 0 ? (
        <EmptyState
          title="Verification Queue Empty"
          description="All field surveys, biodiversity sightings, and restoration nursery plots have been reviewed and validated. New researcher submissions will appear here automatically."
        />
      ) : displayedItems.length === 0 ? (
        <EmptyState
          title="No Pending Records in this Category"
          description={`All submissions in the ${activeTab === 'survey' ? 'Reef Surveys' : activeTab === 'species' ? 'Biodiversity Records' : 'Restoration Tracker'} category are reviewed and validated.`}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {displayedItems.map((item) => {
            const isProcessing = processingId === item._id;

            return (
              <div
                key={`${item._category}-${item._id}`}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  borderLeft: `4px solid ${
                    item._category === 'survey' ? 'var(--teal-500)' :
                    item._category === 'species' ? 'var(--navy-600)' :
                    '#10b981'
                  }`
                }}
              >
                <div style={{ flex: '1 1 340px' }}>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span className="badge badge-warning">Pending Review</span>

                    {item._category === 'survey' && (
                      <span className="badge badge-teal" style={{ fontWeight: 600 }}>
                        Reef Transect Survey
                      </span>
                    )}

                    {item._category === 'species' && (
                      <>
                        <span className="badge badge-navy" style={{ fontWeight: 600 }}>
                          Biodiversity Record
                        </span>
                        <span className={`badge ${item.type === 'coral' ? 'badge-teal' : item.type === 'fish' ? 'badge-navy' : 'badge-coral'}`}>
                          {item.type}
                        </span>
                      </>
                    )}

                    {item._category === 'restoration' && (
                      <span className="badge badge-green" style={{ fontWeight: 600 }}>
                        Restoration Nursery Plot
                      </span>
                    )}

                    <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                      {new Date(item._date).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '17px', color: 'var(--navy-900)', margin: '0 0 8px 0', fontWeight: 700 }}>
                    {item._title}
                  </h3>

                  {/* Category-Specific Details Grid */}
                  {item._category === 'survey' && (
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--slate-700)', flexWrap: 'wrap' }}>
                      <div>
                        Cover: <strong style={{ color: 'var(--teal-600)' }}>{item.coralCoverPercent}%</strong>
                      </div>
                      <div>
                        Bleaching: <strong style={{ color: item.bleachingPercent >= 30 ? 'var(--coral-500)' : 'var(--slate-800)' }}>{item.bleachingPercent}%</strong>
                      </div>
                      <div>
                        Depth: <strong>{item.depth}m</strong>
                      </div>
                      {typeof item.gpsLat === 'number' && (
                        <div>
                          GPS: <code>{item.gpsLat.toFixed(3)}°N, {item.gpsLng.toFixed(3)}°E</code>
                        </div>
                      )}
                      <div>
                        Surveyor: <strong>{item._user?.name || 'Field Station'}</strong> {item._user?.email ? `(${item._user.email})` : ''}
                      </div>
                    </div>
                  )}

                  {item._category === 'species' && (
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--slate-700)', flexWrap: 'wrap' }}>
                      <div>
                        Location: <strong>{item.location}</strong>
                      </div>
                      <div>
                        Specimen Count: <strong style={{ color: 'var(--teal-600)' }}>{item.count} observed</strong>
                      </div>
                      <div>
                        Recorded By: <strong>{item._user?.name || 'Marine Station'}</strong> {item._user?.email ? `(${item._user.email})` : ''}
                      </div>
                    </div>
                  )}

                  {item._category === 'restoration' && (
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--slate-700)', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        Outplanted Taxon: <span className="badge badge-teal">{item.coralSpecies}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Survival: <strong>{item.survivalRatePercent}%</strong>
                        <div className="progress-bar" style={{ width: '70px', height: '6px' }}>
                          <div
                            className={`progress-fill ${item.survivalRatePercent >= 75 ? 'good' : item.survivalRatePercent >= 50 ? 'moderate' : 'poor'}`}
                            style={{ width: `${item.survivalRatePercent}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        Logged By: <strong>{item._user?.name || 'Marine Station'}</strong> {item._user?.email ? `(${item._user.email})` : ''}
                      </div>
                    </div>
                  )}

                  {/* Attached photo link if available */}
                  {item._category === 'survey' && item.photoUrl && (
                    <div style={{ marginTop: '10px' }}>
                      <a
                        href={item.photoUrl.startsWith('http') ? item.photoUrl : `${BACKEND_URL}${item.photoUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <HiOutlinePhoto size={13} /> View Transect Photo
                      </a>
                    </div>
                  )}
                </div>

                {/* Approve & Reject Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={isProcessing}
                    style={{ backgroundColor: 'var(--teal-500)', color: '#fff', padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleAction(item._category, item._id, 'verified', item._title)}
                  >
                    <HiOutlineCheckCircle size={16} /> Approve &amp; Verify
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={isProcessing}
                    style={{ backgroundColor: 'var(--danger)', color: '#fff', padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleAction(item._category, item._id, 'rejected', item._title)}
                  >
                    <HiOutlineXCircle size={16} /> Reject Submission
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
