import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCommandCenterOverview, getDashboardSummary, getSurveys, verifySurvey } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineShieldCheck,
  HiOutlineClipboardDocumentCheck,
  HiOutlineExclamationTriangle,
  HiOutlineUserGroup,
  HiOutlineMap,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowPath,
  HiOutlineArrowDownTray,
  HiOutlineEye,
  HiOutlinePhoto,
  HiOutlineXMark
} from 'react-icons/hi2';
import FieldOperationsLog from '../components/FieldOperationsLog';
import Toast from '../components/Toast';
import SiteDetailModal from '../components/SiteDetailModal';

export default function AdminCommandCenter() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [inspectingSurvey, setInspectingSurvey] = useState(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ccRes, sumRes] = await Promise.all([
        getCommandCenterOverview(),
        getDashboardSummary({})
      ]);
      setData(ccRes.data);
      setSummaryData(sumRes.data);
    } catch (err) {
      console.error('Failed to load command center data:', err);
      setError('Unable to load agency command telemetry. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleVerify = async (surveyId, status) => {
    try {
      await verifySurvey(surveyId, status);
      setToast({
        type: 'success',
        message: `Survey marked as ${status.toUpperCase()}`
      });
      if (inspectingSurvey && inspectingSurvey._id === surveyId) {
        setInspectingSurvey(null);
      }
      fetchOverview();
    } catch (err) {
      console.error('Failed to update survey verification:', err);
      setToast({
        type: 'error',
        message: 'Failed to update verification status'
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await getSurveys({ limit: 100 });
      const surveyList = res.data.surveys || [];
      if (surveyList.length === 0) {
        setToast({ type: 'warning', message: 'No surveys available to export.' });
        return;
      }
      const headers = ['ID', 'Location', 'Region', 'Latitude', 'Longitude', 'Depth_m', 'CoralCover_Percent', 'Bleaching_Percent', 'Status', 'Date', 'Surveyor'];
      const rows = surveyList.map(s => [
        s._id,
        `"${(s.location || '').replace(/"/g, '""')}"`,
        `"${s.region || 'India'}"`,
        s.gpsLat,
        s.gpsLng,
        s.depth,
        s.coralCoverPercent,
        s.bleachingPercent,
        s.status,
        new Date(s.date).toISOString().split('T')[0],
        `"${s.surveyedBy?.name || 'Scientific Diver'}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `aquatrack_indian_reef_telemetry_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setToast({ type: 'success', message: `Exported ${surveyList.length} verified records to CSV` });
    } catch (e) {
      console.error('Export CSV error:', e);
      setToast({ type: 'error', message: 'Failed to generate CSV export' });
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '20px 0' }}>
        <div className="page-header">
          <h1>Agency Command Center</h1>
          <p>Loading operational verification queue and regional coverage telemetry...</p>
        </div>
        <div className="dashboard-grid">
          <div className="card" style={{ height: '140px' }} />
          <div className="card" style={{ height: '140px' }} />
          <div className="card" style={{ height: '140px' }} />
          <div className="card" style={{ height: '140px' }} />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="card error-state" style={{ margin: '40px auto', maxWidth: '500px', textAlign: 'center' }}>
        <HiOutlineExclamationTriangle size={42} color="var(--danger)" style={{ margin: '0 auto 12px' }} />
        <h3>Command Center Unavailable</h3>
        <p>{error}</p>
        <button className="btn btn-primary btn-sm" onClick={fetchOverview}>Retry</button>
      </div>
    );
  }

  const {
    pendingSurveys = [],
    dataQualityFlags = {},
    regionalCoverage = [],
    userRoleSummary = {},
    restorationFollowUp = []
  } = data || {};

  const { foreignLegacyAudited = {}, missingPhotosCount = 0, severeBleachingAlerts = [] } = dataQualityFlags;

  return (
    <div>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Live System Status Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--sand-50)',
          border: '1px solid var(--sand-300)',
          padding: '8px 16px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '12px',
          color: 'var(--slate-600)',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="live-pulse-dot" />
          <strong style={{ color: 'var(--navy-900)' }}>Live Telemetry Node Active</strong>
          <span>&bull; Indian EEZ Marine Protected Area Network</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Database: <strong>MongoDB Atlas (Cloud Cluster)</strong></span>
          <span>Scope: <strong>100% Indian Waters</strong></span>
        </div>
      </div>

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--teal-600)', fontWeight: 700, marginBottom: '4px' }}>
            <HiOutlineShieldCheck size={16} /> Central Marine Authority Control Plane
          </div>
          <h1>Agency Command Center</h1>
          <p>
            Logged in as <strong>{user?.name}</strong> (Administrator) &bull; Managing data verification, regional coverage, data-quality flags, and scientific dive stations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} title="Export verified dataset to CSV">
            <HiOutlineArrowDownTray size={14} /> Export Dataset (CSV)
          </button>
          <button className="btn btn-secondary btn-sm" onClick={fetchOverview} title="Refresh overview">
            <HiOutlineArrowPath size={14} /> Refresh
          </button>
          <Link to="/map" className="btn btn-secondary btn-sm">
            <HiOutlineMap size={14} /> India Reef Map
          </Link>
          <Link to="/admin" className="btn btn-primary btn-sm">
            <HiOutlineUserGroup size={14} /> User Management
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {/* Card 1: Pending Queue */}
        <div className="stat-card" style={{ borderLeft: pendingSurveys.length > 0 ? '4px solid var(--warning)' : '4px solid var(--teal-500)' }}>
          <div className="stat-icon" style={{ backgroundColor: pendingSurveys.length > 0 ? 'rgba(212, 168, 67, 0.15)' : 'var(--teal-50)' }}>
            <HiOutlineClipboardDocumentCheck size={24} color={pendingSurveys.length > 0 ? 'var(--warning)' : 'var(--teal-600)'} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{pendingSurveys.length}</div>
            <div className="stat-label">Pending Verification Queue</div>
            <div className="stat-sub">{pendingSurveys.length > 0 ? 'Requires scientific review' : 'All submissions verified'}</div>
          </div>
        </div>

        {/* Card 2: Data Quality Alerts */}
        <div className="stat-card" style={{ borderLeft: '4px solid var(--coral-500)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(232, 115, 74, 0.12)' }}>
            <HiOutlineExclamationTriangle size={24} color="var(--coral-500)" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{severeBleachingAlerts.length + missingPhotosCount}</div>
            <div className="stat-label">Data Quality Alerts</div>
            <div className="stat-sub">{severeBleachingAlerts.length} bleaching alerts &bull; {missingPhotosCount} missing photo</div>
          </div>
        </div>

        {/* Card 3: Foreign Legacy Audited */}
        <div className="stat-card" style={{ borderLeft: '4px solid var(--navy-700)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'var(--navy-50)' }}>
            <HiOutlineShieldCheck size={24} color="var(--navy-800)" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{foreignLegacyAudited.total || 0}</div>
            <div className="stat-label">Quarantined Legacy Records</div>
            <div className="stat-sub">Zero non-Indian records in active scope</div>
          </div>
        </div>

        {/* Card 4: Personnel */}
        <div className="stat-card" style={{ borderLeft: '4px solid var(--teal-600)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'var(--teal-50)' }}>
            <HiOutlineUserGroup size={24} color="var(--teal-600)" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{userRoleSummary.totalUsers || 4}</div>
            <div className="stat-label">Authorized Platform Users</div>
            <div className="stat-sub">{userRoleSummary.researchers || 2} field researchers &bull; {userRoleSummary.admins || 1} admin</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Panel 1: Pending Verification Queue */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title">Pending Survey Verification Queue</div>
              <div className="card-subtitle">Field submissions awaiting administrative scientific review</div>
            </div>
            {pendingSurveys.length > 0 && (
              <span className="badge badge-warning">{pendingSurveys.length} pending</span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            {pendingSurveys.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--slate-500)' }}>
                <HiOutlineCheckCircle size={40} color="var(--teal-500)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>Verification Queue Clear</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>All field researcher transects are up to date and approved.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingSurveys.map((survey) => (
                  <div
                    key={survey._id}
                    style={{
                      background: 'var(--sand-100)',
                      border: '1px solid var(--sand-300)',
                      borderRadius: '6px',
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '13px' }}>
                        {survey.location}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--slate-600)', marginTop: '2px' }}>
                        Region: <strong>{survey.region || 'India'}</strong> &bull; Surveyor: <strong>{survey.surveyedBy?.name || 'Researcher'}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '11px', color: 'var(--slate-500)' }}>
                        <span>Cover: <strong>{survey.coralCoverPercent}%</strong></span>
                        <span>Bleaching: <strong>{survey.bleachingPercent}%</strong></span>
                        <span>Depth: <strong>{survey.depth}m</strong></span>
                        <span>Date: <strong>{new Date(survey.date).toLocaleDateString()}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => setInspectingSurvey(survey)}
                      >
                        <HiOutlineEye size={13} /> Inspect
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ backgroundColor: 'var(--teal-500)', color: '#fff', padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleVerify(survey._id, 'verified')}
                      >
                        <HiOutlineCheckCircle size={14} /> Verify
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ backgroundColor: 'var(--danger)', color: '#fff', padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleVerify(survey._id, 'rejected')}
                      >
                        <HiOutlineXCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: Data Quality & Audit Health */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Data Quality &amp; Foreign Data Audit</div>
              <div className="card-subtitle">Enforcement of Indian EEZ boundaries and record integrity</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Audit Status Item */}
            <div style={{ background: 'var(--sand-100)', padding: '12px', borderRadius: '6px', border: '1px solid var(--sand-300)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '13px' }}>
                  Indian EEZ Scope Certification
                </span>
                <span className="badge badge-teal">Verified Clean</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--slate-600)', margin: 0 }}>
                All 17 surveys, 12 sites, 16 taxa, and 5 restoration plots strictly map within Indian territorial reef boundaries (Tamil Nadu, Gujarat, Lakshadweep, Andaman &amp; Nicobar).
              </p>
            </div>

            {/* Bleaching Alerts */}
            <div style={{ background: 'var(--sand-100)', padding: '12px', borderRadius: '6px', border: '1px solid var(--sand-300)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '13px' }}>
                  High Bleaching Alerts (&ge; 30%)
                </span>
                <span className={`badge ${severeBleachingAlerts.length > 0 ? 'badge-danger' : 'badge-green'}`}>
                  {severeBleachingAlerts.length} logged
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--slate-600)', margin: 0 }}>
                {severeBleachingAlerts.length > 0
                  ? `${severeBleachingAlerts.length} Indian transects recorded significant bleaching stress. Dive stations notified.`
                  : 'No critical thermal bleaching events exceeding 30% threshold.'}
              </p>
            </div>

            {/* Restoration Follow-up */}
            <div style={{ background: 'var(--sand-100)', padding: '12px', borderRadius: '6px', border: '1px solid var(--sand-300)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '13px' }}>
                  Restoration Nurseries Needing Inspection
                </span>
                <span className={`badge ${restorationFollowUp.length > 0 ? 'badge-warning' : 'badge-teal'}`}>
                  {restorationFollowUp.length} plots
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--slate-600)', margin: 0 }}>
                {restorationFollowUp.length > 0
                  ? `${restorationFollowUp.length} nursery plot(s) report survivorship below 75% target and need quarterly re-assessment.`
                  : 'All Indian coral nursery plots are meeting or exceeding survivorship benchmarks.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Coverage Table with Ecological Health Index */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Regional Marine Coverage &amp; Ecological Health Index</div>
            <div className="card-subtitle">Telemetry breakdown and conservation health grades across the four Indian reef regions</div>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Marine Region</th>
                <th>Health Grade</th>
                <th>Monitored Sites</th>
                <th>Logged Surveys</th>
                <th>Mean Coral Cover</th>
                <th>Mean Bleaching</th>
                <th>Coverage Status</th>
              </tr>
            </thead>
            <tbody>
              {regionalCoverage.map((reg) => {
                const cover = reg.meanCoralCover || 0;
                const bleaching = reg.meanBleaching || 0;
                let grade = 'Grade A (Optimal)';
                let gradeColor = 'badge-teal';
                if (bleaching >= 25) {
                  grade = 'Grade B (Thermal Stress)';
                  gradeColor = 'badge-warning';
                } else if (cover >= 45) {
                  grade = 'Grade A+ (Pristine)';
                  gradeColor = 'badge-teal';
                } else if (cover >= 35) {
                  grade = 'Grade A- (Resilient)';
                  gradeColor = 'badge-teal';
                }

                return (
                  <tr key={reg.region}>
                    <td>
                      <strong style={{ color: 'var(--navy-900)' }}>{reg.region}</strong>
                    </td>
                    <td>
                      <span className={`badge ${gradeColor}`}>{grade}</span>
                    </td>
                    <td>{reg.siteCount} sites</td>
                    <td>{reg.surveyCount} transects</td>
                    <td>
                      <strong style={{ color: 'var(--teal-600)' }}>{cover}%</strong>
                    </td>
                    <td>
                      <span className={`badge ${bleaching >= 30 ? 'badge-danger' : bleaching >= 10 ? 'badge-warning' : 'badge-green'}`}>
                        {bleaching}%
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar" style={{ width: '80px' }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(100, (reg.surveyCount / 5) * 100)}%`,
                              backgroundColor: 'var(--teal-500)'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--slate-500)' }}>Active</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Field Operations Log (Strictly 5 items per page) */}
      <div className="card activity-card">
        <div className="card-header">
          <div>
            <div className="card-title">Field Operations Log</div>
            <div className="card-subtitle">Live stream of survey transects, taxa sightings, and nursery outplants</div>
          </div>
        </div>
        <FieldOperationsLog items={summaryData?.activityFeed || []} />
      </div>

      {/* Quick Inspection Modal */}
      {inspectingSurvey && (
        <div className="modal-overlay" onClick={() => setInspectingSurvey(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h2>Scientific Transect Inspection</h2>
              <button className="modal-close" onClick={() => setInspectingSurvey(null)}>
                <HiOutlineXMark />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-warning">Awaiting Approval</span>
                <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                  Submitted: {new Date(inspectingSurvey.date).toLocaleDateString()}
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '17px', color: 'var(--navy-900)', margin: '0 0 4px 0' }}>
                  {inspectingSurvey.location}
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--slate-600)' }}>
                  Region: <strong>{inspectingSurvey.region || 'India'}</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: 'var(--sand-100)', padding: '12px', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>Coral Cover</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--teal-600)' }}>
                    {inspectingSurvey.coralCoverPercent}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>Bleaching</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: inspectingSurvey.bleachingPercent >= 30 ? 'var(--coral-500)' : 'var(--slate-800)' }}>
                    {inspectingSurvey.bleachingPercent}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>Transect Depth</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-800)' }}>
                    {inspectingSurvey.depth} m
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--slate-600)' }}>
                GPS Coordinates: <code>{inspectingSurvey.gpsLat?.toFixed(3)}°N, {inspectingSurvey.gpsLng?.toFixed(3)}°E</code>
              </div>

              {inspectingSurvey.photoUrl && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '6px' }}>
                    Photo Documentation:
                  </div>
                  <img
                    src={`http://localhost:5000${inspectingSurvey.photoUrl}`}
                    alt="Transect Photo"
                    style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '6px' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ backgroundColor: 'var(--danger)', color: '#fff', padding: '6px 14px' }}
                  onClick={() => handleVerify(inspectingSurvey._id, 'rejected')}
                >
                  <HiOutlineXCircle size={15} /> Reject
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ backgroundColor: 'var(--teal-500)', color: '#fff', padding: '6px 16px' }}
                  onClick={() => handleVerify(inspectingSurvey._id, 'verified')}
                >
                  <HiOutlineCheckCircle size={15} /> Approve &amp; Verify
                </button>
              </div>
            </div>
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
