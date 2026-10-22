import { useState, useEffect } from 'react';
import { getSiteById } from '../api';
import {
  HiOutlineXMark,
  HiOutlineClipboardDocumentList,
  HiOutlineGlobeAmericas,
  HiOutlineSparkles,
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineShieldCheck,
  HiOutlinePhoto
} from 'react-icons/hi2';

export default function SiteDetailModal({ siteId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  useEffect(() => {
    if (!siteId) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    getSiteById(siteId)
      .then((res) => {
        if (isMounted) setData(res.data);
      })
      .catch((err) => {
        console.error('Failed to load site detail:', err);
        if (isMounted) setError('Unable to load site operational record.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [siteId]);

  if (!siteId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--sand-300)', padding: '16px 24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--navy-900)' }}>
                {data?.site?.name || 'Reef Conservation Site'}
              </h2>
              {data?.site?.region && (
                <span className="badge badge-navy" style={{ fontSize: '11px' }}>
                  {data.site.region}
                </span>
              )}
              {data?.site?.isMarineProtectedArea && (
                <span className="badge badge-teal" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                  <HiOutlineShieldCheck size={12} /> Marine Protected Area
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>
                <HiOutlineMapPin style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                {data?.site?.coordinates?.lat.toFixed(3)}°N, {data?.site?.coordinates?.lng.toFixed(3)}°E
                {data?.site?.coordinates?.isApproximate && ' (approximate)'}
              </span>
              <span>•</span>
              <span>{data?.site?.stateOrUT || 'India'}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">
            <HiOutlineXMark />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--slate-500)' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
              <p>Aggregating site telemetry and longitudinal observations...</p>
            </div>
          ) : error ? (
            <div className="card error-state" style={{ margin: '20px 0' }}>
              <p>{error}</p>
              <button className="btn btn-primary btn-sm" onClick={() => {
                setLoading(true);
                getSiteById(siteId).then(res => setData(res.data)).catch(() => setError('Retry failed')).finally(() => setLoading(false));
              }}>
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Site Description */}
              {data?.site?.description && (
                <div style={{ background: 'var(--sand-100)', border: '1px solid var(--sand-300)', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', color: 'var(--slate-700)', marginBottom: '20px' }}>
                  {data.site.description}
                </div>
              )}

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--sand-50)', border: '1px solid var(--sand-300)', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Total Surveys</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)', marginTop: '2px' }}>
                    {data?.stats?.surveyCount ?? 0}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>
                    {data?.stats?.latestSurveyDate ? `Latest: ${new Date(data.stats.latestSurveyDate).toLocaleDateString()}` : 'No surveys yet'}
                  </div>
                </div>

                <div style={{ background: 'var(--sand-50)', border: '1px solid var(--sand-300)', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Latest Coral Cover</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--teal-600)', marginTop: '2px' }}>
                    {data?.stats?.latestCoralCover !== null ? `${data.stats.latestCoralCover}%` : 'N/A'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>Recorded substrate cover</div>
                </div>

                <div style={{ background: 'var(--sand-50)', border: '1px solid var(--sand-300)', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Latest Bleaching</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: (data?.stats?.latestBleaching >= 30 ? 'var(--coral-500)' : data?.stats?.latestBleaching >= 10 ? 'var(--warning)' : 'var(--teal-500)'), marginTop: '2px' }}>
                    {data?.stats?.latestBleaching !== null ? `${data.stats.latestBleaching}%` : 'N/A'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>Recorded thermal stress</div>
                </div>

                <div style={{ background: 'var(--sand-50)', border: '1px solid var(--sand-300)', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Taxa Documented</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-800)', marginTop: '2px' }}>
                    {data?.stats?.speciesCount ?? 0}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>Logged biodiversity records</div>
                </div>

                <div style={{ background: 'var(--sand-50)', border: '1px solid var(--sand-300)', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Restoration Plots</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--success)', marginTop: '2px' }}>
                    {data?.stats?.restorationCount ?? 0}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>Active propagation frames</div>
                </div>
              </div>

              {/* Integrated Chronological Timeline */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', color: 'var(--navy-900)', fontWeight: 600 }}>
                    Chronological Field Activity Timeline
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                    {data?.timeline?.length || 0} event(s) recorded
                  </span>
                </div>

                {(!data?.timeline || data.timeline.length === 0) ? (
                  <div style={{ padding: '24px', textAlign: 'center', background: 'var(--sand-100)', borderRadius: '6px', color: 'var(--slate-500)', fontSize: '13px' }}>
                    No field surveys, sightings, or restoration logs linked to this site yet.
                  </div>
                ) : (
                  <div className="site-timeline" style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid var(--sand-300)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {data.timeline.map((event, idx) => {
                      const isSurvey = event.type === 'survey';
                      const isSpecies = event.type === 'species';
                      const isRestoration = event.type === 'restoration';

                      const dotColor = isSurvey
                        ? (event.data?.bleachingPercent >= 30 ? 'var(--coral-500)' : 'var(--teal-500)')
                        : isSpecies
                        ? 'var(--navy-600)'
                        : 'var(--success)';

                      return (
                        <div key={idx} style={{ position: 'relative', background: '#fff', border: '1px solid var(--sand-300)', borderRadius: '6px', padding: '12px 14px' }}>
                          {/* Dot on line */}
                          <div style={{
                            position: 'absolute',
                            left: '-31px',
                            top: '16px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: dotColor,
                            border: '2px solid #fff',
                            boxShadow: '0 0 0 2px ' + dotColor
                          }} />

                          {/* Event Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isSurvey && <HiOutlineClipboardDocumentList color="var(--teal-600)" size={16} />}
                              {isSpecies && <HiOutlineGlobeAmericas color="var(--navy-600)" size={16} />}
                              {isRestoration && <HiOutlineSparkles color="var(--success)" size={16} />}
                              <strong style={{ fontSize: '13px', color: 'var(--navy-900)' }}>
                                {event.title}
                              </strong>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <HiOutlineCalendar size={13} />
                              {new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          </div>

                          {/* Event Detail Summary */}
                          <div style={{ fontSize: '12px', color: 'var(--slate-600)', marginTop: '4px' }}>
                            {event.summary}
                          </div>

                          {/* Submitter info */}
                          {event.actor && (
                            <div style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '4px' }}>
                              Logged by {event.actor}
                            </div>
                          )}

                          {/* Photo record if available */}
                          {event.photoUrl && (
                            <div style={{ marginTop: '8px' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 8px' }}
                                onClick={() => setPreviewPhoto(event.photoUrl)}
                              >
                                <HiOutlinePhoto size={13} /> View Survey Photographic Transect
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--sand-300)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
            Illustrative demo data — not official monitoring observations.
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Photo Lightbox */}
        {previewPhoto && (
          <div
            className="modal-overlay"
            style={{ zIndex: 1100, background: 'rgba(7, 30, 43, 0.85)' }}
            onClick={() => setPreviewPhoto(null)}
          >
            <div style={{ maxWidth: '700px', width: '90%', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
              <img
                src={previewPhoto}
                alt="Transect photographic record"
                style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '8px', border: '2px solid #fff' }}
              />
              <div style={{ marginTop: '10px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setPreviewPhoto(null)}>
                  Close Photo Preview
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
