import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSurveys, getSites, getDashboardSummary } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineClipboardDocumentList,
  HiOutlinePlusCircle,
  HiOutlineGlobeAmericas,
  HiOutlineSparkles,
  HiOutlineMapPin,
  HiOutlineMap,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineEye,
  HiOutlineArrowPath
} from 'react-icons/hi2';
import FieldOperationsLog from '../components/FieldOperationsLog';
import SiteDetailModal from '../components/SiteDetailModal';

export default function ResearcherWorkspace() {
  const { user } = useAuth();
  const [mySurveys, setMySurveys] = useState([]);
  const [sites, setSites] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState(null);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      const [surveysRes, sitesRes, sumRes] = await Promise.all([
        getSurveys({ surveyedBy: user?._id }),
        getSites(),
        getDashboardSummary({})
      ]);
      setMySurveys(surveysRes.data.surveys || []);
      setSites(sitesRes.data.sites || []);
      setSummaryData(sumRes.data);
    } catch (err) {
      console.error('Failed to load researcher workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [user?._id]);

  const pendingCount = mySurveys.filter(s => s.status === 'pending').length;
  const verifiedCount = mySurveys.filter(s => s.status === 'verified').length;

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--teal-600)', fontWeight: 700, marginBottom: '4px' }}>
            <HiOutlineMapPin size={16} /> Field Researcher Operations
          </div>
          <h1>Field Workspace</h1>
          <p>
            Welcome, <strong>{user?.name}</strong> &bull; Scientific Diver &amp; Marine Researcher &bull; Record observations, verify transect submissions, and manage nursery outplants.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchWorkspaceData} title="Refresh workspace">
            <HiOutlineArrowPath size={14} /> Refresh
          </button>
          <Link to="/map" className="btn btn-secondary btn-sm">
            <HiOutlineMap size={14} /> India Reef Map
          </Link>
          <Link to="/surveys" className="btn btn-primary btn-sm">
            <HiOutlinePlusCircle size={14} /> Log New Survey
          </Link>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <Link
          to="/surveys"
          className="card"
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            borderLeft: '4px solid var(--teal-500)'
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'var(--teal-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal-600)' }}>
            <HiOutlineClipboardDocumentList size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '14px' }}>Log Reef Survey</div>
            <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Record transect data &amp; cover</div>
          </div>
        </Link>

        <Link
          to="/species"
          className="card"
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            borderLeft: '4px solid var(--navy-600)'
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'var(--navy-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy-700)' }}>
            <HiOutlineGlobeAmericas size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '14px' }}>Log Sighting</div>
            <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Record coral, fish, or invertebrate</div>
          </div>
        </Link>

        <Link
          to="/restoration"
          className="card"
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            borderLeft: '4px solid var(--coral-500)'
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(232, 115, 74, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--coral-500)' }}>
            <HiOutlineSparkles size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '14px' }}>Restoration Update</div>
            <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Record nursery outplant or survival</div>
          </div>
        </Link>
      </div>

      {/* Grid: My Submissions & Approval Status + Registered Sites */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Panel 1: My Submissions & Approval Status */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title">My Recent Submissions</div>
              <div className="card-subtitle">Transects submitted by your user account &amp; verification status</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="badge badge-teal">{verifiedCount} verified</span>
              {pendingCount > 0 && <span className="badge badge-warning">{pendingCount} pending</span>}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {mySurveys.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--slate-500)' }}>
                <HiOutlineClock size={36} color="var(--slate-400)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>No Submissions Yet</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>Surveys you log will appear here with live agency verification status.</div>
                <Link to="/surveys" className="btn btn-primary btn-sm" style={{ marginTop: '12px', display: 'inline-flex' }}>
                  Log First Survey
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mySurveys.slice(0, 6).map((survey) => {
                  const isVerified = survey.status === 'verified';
                  const isPending = survey.status === 'pending';
                  const isRejected = survey.status === 'rejected';

                  return (
                    <div
                      key={survey._id}
                      style={{
                        background: 'var(--sand-100)',
                        border: '1px solid var(--sand-300)',
                        borderRadius: '6px',
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '13px' }}>
                          {survey.location}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>
                          {survey.region} &bull; {new Date(survey.date).toLocaleDateString()} &bull; Depth: {survey.depth}m
                        </div>
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>
                          <span style={{ color: 'var(--teal-600)', fontWeight: 600 }}>{survey.coralCoverPercent}% cover</span>
                          {' '}&bull;{' '}
                          <span style={{ color: survey.bleachingPercent >= 30 ? 'var(--coral-500)' : 'var(--slate-700)' }}>
                            {survey.bleachingPercent}% bleaching
                          </span>
                        </div>
                      </div>

                      <div>
                        {isVerified && (
                          <span className="badge badge-teal" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <HiOutlineCheckCircle size={12} /> Verified
                          </span>
                        )}
                        {isPending && (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <HiOutlineClock size={12} /> Pending Review
                          </span>
                        )}
                        {isRejected && (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <HiOutlineExclamationCircle size={12} /> Revision
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: Monitored Indian Reef Sites */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title">Monitored Indian Reef Sites</div>
              <div className="card-subtitle">Active stations across the four marine zones</div>
            </div>
            <Link to="/map" className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
              View on Map
            </Link>
          </div>

          <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sites.map((site) => (
              <div
                key={site._id}
                style={{
                  background: 'var(--sand-100)',
                  border: '1px solid var(--sand-300)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{site.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
                    {site.region} &bull; {site.surveyCount || 0} survey(s) &bull; {site.restorationCount || 0} nursery plot(s)
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                  onClick={() => setSelectedSiteId(site._id)}
                >
                  <HiOutlineEye size={12} /> Timeline
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Field Operations Log (Strictly 5 items per page) */}
      <div className="card activity-card">
        <div className="card-header">
          <div>
            <div className="card-title">Field Operations Log</div>
            <div className="card-subtitle">Stream of recent submissions from marine research diving stations</div>
          </div>
        </div>
        <FieldOperationsLog items={summaryData?.activityFeed || []} />
      </div>

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
