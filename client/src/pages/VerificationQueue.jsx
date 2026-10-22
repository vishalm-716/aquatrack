import React, { useState, useEffect } from 'react';
import { getSurveys, verifySurvey } from '../api';
import {
  HiOutlineClipboardDocumentCheck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowPath,
  HiOutlinePhoto,
  HiOutlineExclamationTriangle
} from 'react-icons/hi2';
import Toast from '../components/Toast';
import EmptyState from '../components/EmptyState';

export default function VerificationQueue() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await getSurveys({ status: 'pending' });
      setSurveys(res.data.surveys || []);
    } catch (err) {
      console.error('Failed to load verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (surveyId, status) => {
    try {
      await verifySurvey(surveyId, status);
      setToast({
        type: 'success',
        message: `Survey marked as ${status.toUpperCase()}`
      });
      fetchQueue();
    } catch (err) {
      console.error('Failed to update survey status:', err);
      setToast({
        type: 'error',
        message: 'Failed to update verification status'
      });
    }
  };

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
            Review and validate incoming transect submissions from field research stations across Indian coral reef regions.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchQueue} title="Refresh queue">
          <HiOutlineArrowPath size={14} /> Refresh Queue
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          Loading pending submissions...
        </div>
      ) : surveys.length === 0 ? (
        <EmptyState
          title="Verification Queue Empty"
          description="All field surveys from research stations have been reviewed and validated. New researcher submissions will appear here automatically."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {surveys.map((survey) => (
            <div
              key={survey._id}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                borderLeft: '4px solid var(--warning)'
              }}
            >
              <div style={{ flex: '1 1 320px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-warning">Pending Review</span>
                  <span className="badge badge-navy">{survey.region || 'India'}</span>
                  <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                    {new Date(survey.date).toLocaleDateString()}
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', color: 'var(--navy-900)', margin: '0 0 6px 0' }}>
                  {survey.location}
                </h3>

                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--slate-700)', flexWrap: 'wrap' }}>
                  <div>
                    Cover: <strong style={{ color: 'var(--teal-600)' }}>{survey.coralCoverPercent}%</strong>
                  </div>
                  <div>
                    Bleaching: <strong style={{ color: survey.bleachingPercent >= 30 ? 'var(--coral-500)' : 'var(--slate-800)' }}>{survey.bleachingPercent}%</strong>
                  </div>
                  <div>
                    Depth: <strong>{survey.depth}m</strong>
                  </div>
                  <div>
                    GPS: <code>{survey.gpsLat.toFixed(3)}°N, {survey.gpsLng.toFixed(3)}°E</code>
                  </div>
                  <div>
                    Logged By: <strong>{survey.surveyedBy?.name || 'Researcher'}</strong> ({survey.surveyedBy?.email || 'Field Station'})
                  </div>
                </div>

                {survey.photoUrl && (
                  <div style={{ marginTop: '10px' }}>
                    <a
                      href={`http://localhost:5000${survey.photoUrl}`}
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

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ backgroundColor: 'var(--teal-500)', color: '#fff', padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => handleAction(survey._id, 'verified')}
                >
                  <HiOutlineCheckCircle size={16} /> Approve &amp; Verify
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ backgroundColor: 'var(--danger)', color: '#fff', padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => handleAction(survey._id, 'rejected')}
                >
                  <HiOutlineXCircle size={16} /> Reject Submission
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
