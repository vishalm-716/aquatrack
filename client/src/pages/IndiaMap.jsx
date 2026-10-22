import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getSites } from '../api';
import {
  HiOutlineMapPin,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineEye,
  HiOutlineArrowPath,
  HiOutlineExclamationTriangle,
  HiOutlineListBullet,
  HiOutlineMap,
  HiOutlineInformationCircle,
  HiOutlineShieldCheck
} from 'react-icons/hi2';
import SiteDetailModal from '../components/SiteDetailModal';

// India overview bounding box (strictly covers mainland reef regions, Lakshadweep, and Andaman & Nicobar)
const INDIA_BOUNDS = [
  [6.5, 68.2],   // Southwest
  [23.5, 94.5]   // Northeast
];

// Regional zoom presets for easy navigation without losing context
const REGION_PRESETS = {
  all: { name: 'All India', bounds: INDIA_BOUNDS },
  'Gulf of Mannar': { name: 'Gulf of Mannar', bounds: [[8.8, 78.8], [9.5, 79.5]] },
  'Gulf of Kachchh': { name: 'Gulf of Kachchh', bounds: [[22.2, 69.4], [22.8, 70.2]] },
  'Lakshadweep': { name: 'Lakshadweep', bounds: [[9.8, 71.8], [11.8, 73.2]] },
  'Andaman & Nicobar Islands': { name: 'Andaman & Nicobar', bounds: [[6.8, 92.2], [13.5, 94.5]] }
};

// Helper component to handle dynamic zooming and panning
function MapController({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
    }
  }, [map, bounds]);
  return null;
}

export default function IndiaMap() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unmappedCount, setUnmappedCount] = useState(0);

  // Filters
  const [regionFilter, setRegionFilter] = useState('all');
  const [bleachingTier, setBleachingTier] = useState('all');
  const [withRestoration, setWithRestoration] = useState(false);
  const [search, setSearch] = useState('');

  // Proportional circle sizing metric: 'activity' | 'surveys' | 'restorations'
  const [sizeMetric, setSizeMetric] = useState('activity');

  // Selected site for details modal
  const [selectedSiteId, setSelectedSiteId] = useState(null);

  // Active view: 'map' or 'table' fallback
  const [viewMode, setViewMode] = useState('map');

  // Active map bounds
  const [activeBounds, setActiveBounds] = useState(INDIA_BOUNDS);

  const fetchSites = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (regionFilter !== 'all') params.region = regionFilter;
      if (withRestoration) params.withRestoration = 'true';
      if (search.trim()) params.search = search.trim();

      if (bleachingTier === 'low') {
        params.maxBleaching = 9.99;
      } else if (bleachingTier === 'moderate') {
        params.minBleaching = 10;
        params.maxBleaching = 29.99;
      } else if (bleachingTier === 'alert') {
        params.minBleaching = 30;
      }

      const res = await getSites(params);
      setSites(res.data.sites || []);
      setUnmappedCount(res.data.unmappedSurveysCount || 0);
    } catch (err) {
      console.error('Failed to load map sites:', err);
      setError('Unable to retrieve geospatial coral reef coordinates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [regionFilter, bleachingTier, withRestoration, search]);

  const handleRegionChange = (newRegion) => {
    setRegionFilter(newRegion);
    if (REGION_PRESETS[newRegion]) {
      setActiveBounds(REGION_PRESETS[newRegion].bounds);
    } else {
      setActiveBounds(INDIA_BOUNDS);
    }
  };

  const handleResetFilters = () => {
    setRegionFilter('all');
    setBleachingTier('all');
    setWithRestoration(false);
    setSearch('');
    setActiveBounds(INDIA_BOUNDS);
  };

  // Helper to compute honest visual circle radius (8–26 px)
  const getCircleRadius = (site) => {
    let volume = 0;
    if (sizeMetric === 'activity') {
      volume = (site.surveyCount || 0) + (site.restorationCount || 0);
    } else if (sizeMetric === 'surveys') {
      volume = site.surveyCount || 0;
    } else if (sizeMetric === 'restorations') {
      volume = site.restorationCount || 0;
    }

    if (volume === 0) return 8; // Small neutral ring for zero activity
    // Square-root scaling bounded between 10px and 26px
    return Math.min(26, Math.max(10, Math.round(9 + Math.sqrt(volume) * 6)));
  };

  // Helper to compute circle color from recorded bleaching tier
  const getCircleColor = (site) => {
    let volume = 0;
    if (sizeMetric === 'activity') {
      volume = (site.surveyCount || 0) + (site.restorationCount || 0);
    } else if (sizeMetric === 'surveys') {
      volume = site.surveyCount || 0;
    } else if (sizeMetric === 'restorations') {
      volume = site.restorationCount || 0;
    }

    if (volume === 0 || site.latestBleaching === null) {
      return '#94A3B8'; // Neutral slate ring
    }

    if (site.latestBleaching >= 30) {
      return '#E8734A'; // High bleaching alert (Coral-orange)
    } else if (site.latestBleaching >= 10) {
      return '#D4A843'; // Moderate bleaching (Amber)
    } else {
      return '#0E7C86'; // Low bleaching < 10% (Teal)
    }
  };

  return (
    <div>
      {/* Disclaimer Banner */}
      <div
        style={{
          background: 'var(--sand-100)',
          border: '1px solid var(--sand-300)',
          borderLeft: '4px solid var(--teal-500)',
          padding: '10px 16px',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--slate-700)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HiOutlineInformationCircle size={18} color="var(--teal-600)" />
          <span>
            <strong>Illustrative demo observations — not official monitoring observations.</strong> Proportional circle sizes represent recorded field activity volume at research diving transects, not physical reef footprint.
          </span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
          Datum: WGS 84 &bull; India Marine Protected Areas
        </div>
      </div>

      {/* Page Header */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h1>India Coral Reef Geographic Workspace</h1>
          <p>Persisted geospatial distribution of monitored Indian reef zones, marine protected areas, and nursery plots</p>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', background: 'var(--sand-200)', padding: '2px', borderRadius: '6px', border: '1px solid var(--sand-300)' }}>
            <button
              className={`btn btn-sm ${viewMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => setViewMode('map')}
            >
              <HiOutlineMap size={15} /> Map View
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => setViewMode('table')}
            >
              <HiOutlineListBullet size={15} /> Tabular Directory
            </button>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={fetchSites} title="Refresh data">
            <HiOutlineArrowPath size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Regional Zoom Inset Shortcuts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy-800)', marginRight: '4px' }}>
          Regional Focus:
        </span>
        {Object.entries(REGION_PRESETS).map(([key, item]) => (
          <button
            key={key}
            type="button"
            className={`btn btn-sm ${regionFilter === key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '12px' }}
            onClick={() => handleRegionChange(key)}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
        {/* Search */}
        <div className="search-input" style={{ minWidth: '200px', flex: '1 1 180px' }}>
          <HiOutlineMapPin />
          <input
            type="text"
            placeholder="Search site, region, or state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Region */}
        <select
          className="filter-select"
          value={regionFilter}
          onChange={(e) => handleRegionChange(e.target.value)}
        >
          <option value="all">All Indian Regions</option>
          <option value="Gulf of Mannar">Gulf of Mannar (Tamil Nadu)</option>
          <option value="Gulf of Kachchh">Gulf of Kachchh (Gujarat)</option>
          <option value="Lakshadweep">Lakshadweep Archipelago</option>
          <option value="Andaman & Nicobar Islands">Andaman & Nicobar Islands</option>
        </select>

        {/* Bleaching Tier */}
        <select
          className="filter-select"
          value={bleachingTier}
          onChange={(e) => setBleachingTier(e.target.value)}
        >
          <option value="all">All Bleaching Tiers</option>
          <option value="low">Recorded Bleaching &lt; 10% (Teal)</option>
          <option value="moderate">Recorded Bleaching 10% – 30% (Amber)</option>
          <option value="alert">Recorded Bleaching ≥ 30% (Coral)</option>
        </select>

        {/* Sizing Metric Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--slate-700)' }}>
          <span>Size Circles By:</span>
          <select
            className="filter-select"
            value={sizeMetric}
            onChange={(e) => setSizeMetric(e.target.value)}
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            <option value="activity">Total Activity (Surveys + Restorations)</option>
            <option value="surveys">Survey Records Only</option>
            <option value="restorations">Restoration Plots Only</option>
          </select>
        </div>

        {/* Restoration toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--slate-700)', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={withRestoration}
            onChange={(e) => setWithRestoration(e.target.checked)}
          />
          Sites with restoration
        </label>

        {/* Reset */}
        {(regionFilter !== 'all' || bleachingTier !== 'all' || withRestoration || search) && (
          <button className="btn btn-secondary btn-sm" onClick={handleResetFilters}>
            Reset Filters
          </button>
        )}

        {/* Sites count */}
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span><strong>{sites.length}</strong> Indian site(s) mapped</span>
          {unmappedCount > 0 && (
            <span
              className="badge badge-warning"
              style={{ fontSize: '11px', cursor: 'help' }}
              title={`${unmappedCount} field records lack assigned coordinates.`}
            >
              {unmappedCount} unmapped records
            </span>
          )}
        </div>
      </div>

      {/* Proportional Circle Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          background: '#fff',
          border: '1px solid var(--sand-300)',
          borderRadius: '6px',
          padding: '10px 16px',
          marginBottom: '12px',
          fontSize: '12px',
          gap: '16px'
        }}
      >
        {/* Color Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>Circle Color (Recorded Bleaching Tier):</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#0E7C86', display: 'inline-block', border: '1.5px solid #fff', boxShadow: '0 0 0 1px #0E7C86' }} />
            <span>&lt; 10% (Low stress)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#D4A843', display: 'inline-block', border: '1.5px solid #fff', boxShadow: '0 0 0 1px #D4A843' }} />
            <span>10% to &lt; 30% (Moderate stress)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#E8734A', display: 'inline-block', border: '1.5px solid #fff', boxShadow: '0 0 0 1px #E8734A' }} />
            <span>&ge; 30% (High stress alert)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: 'transparent', display: 'inline-block', border: '2px solid #94A3B8' }} />
            <span style={{ color: 'var(--slate-500)' }}>0 records / neutral ring</span>
          </div>
        </div>

        {/* Size Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', borderLeft: '1px solid var(--slate-200)', paddingLeft: '14px' }}>
          <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>Circle Size (Logged Activity Volume):</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0E7C86', opacity: 0.8 }} />
              <span style={{ fontSize: '11px', color: 'var(--slate-600)' }}>1 record</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#0E7C86', opacity: 0.8 }} />
              <span style={{ fontSize: '11px', color: 'var(--slate-600)' }}>2–3 records</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0E7C86', opacity: 0.8 }} />
              <span style={{ fontSize: '11px', color: 'var(--slate-600)' }}>4+ records</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      {viewMode === 'map' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--sand-300)', borderRadius: '8px', position: 'relative' }}>
          {error ? (
            <div className="error-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <HiOutlineExclamationTriangle size={36} color="var(--danger)" style={{ margin: '0 auto 12px' }} />
              <h3>Map Tiles Unavailable</h3>
              <p>{error}</p>
              <button className="btn btn-primary btn-sm" onClick={() => setViewMode('table')}>
                Switch to Tabular Site Directory
              </button>
            </div>
          ) : (
            <div style={{ height: '620px', width: '100%', position: 'relative' }}>
              <MapContainer
                bounds={INDIA_BOUNDS}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', background: '#071E2B' }}
              >
                <MapController bounds={activeBounds} />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
                  maxZoom={18}
                />

                {sites.map((site) => {
                  if (!site.coordinates || site.coordinates.lat === undefined || site.coordinates.lng === undefined) {
                    return null;
                  }

                  const radius = getCircleRadius(site);
                  const color = getCircleColor(site);
                  const volume = (site.surveyCount || 0) + (site.restorationCount || 0);

                  return (
                    <CircleMarker
                      key={site._id}
                      center={[site.coordinates.lat, site.coordinates.lng]}
                      radius={radius}
                      pathOptions={{
                        color: '#FFFFFF',
                        weight: 2,
                        fillColor: color,
                        fillOpacity: volume === 0 ? 0.25 : 0.85
                      }}
                    >
                      {/* Tooltip on hover */}
                      <Tooltip direction="top" offset={[0, -radius]} opacity={0.95}>
                        <div style={{ fontWeight: 600, fontSize: '12px' }}>{site.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--slate-600)' }}>
                          {volume} logged event(s) &bull; {site.latestBleaching !== null ? `${site.latestBleaching}% bleaching` : 'No bleaching logged'}
                        </div>
                      </Tooltip>

                      {/* Detail Popup on click */}
                      <Popup minWidth={280} maxWidth={340}>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', padding: '4px 0' }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--navy-900)', marginBottom: '3px' }}>
                            {site.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <span className="badge badge-navy" style={{ fontSize: '10px' }}>
                              {site.region}
                            </span>
                            {site.isMarineProtectedArea && (
                              <span className="badge badge-teal" style={{ fontSize: '10px' }}>
                                MPA
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: 'var(--sand-100)', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                            <div>
                              <div style={{ color: 'var(--slate-500)', fontSize: '10px' }}>Recorded Coral Cover</div>
                              <div style={{ fontWeight: 600, color: 'var(--teal-600)', fontSize: '13px' }}>
                                {site.latestCoralCover !== null ? `${site.latestCoralCover}%` : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div style={{ color: 'var(--slate-500)', fontSize: '10px' }}>Recorded Bleaching</div>
                              <div style={{
                                fontWeight: 600,
                                fontSize: '13px',
                                color: site.latestBleaching >= 30 ? 'var(--coral-500)' : site.latestBleaching >= 10 ? 'var(--warning)' : 'var(--teal-500)'
                              }}>
                                {site.latestBleaching !== null ? `${site.latestBleaching}%` : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div style={{ color: 'var(--slate-500)', fontSize: '10px' }}>Logged Surveys</div>
                              <div style={{ fontWeight: 600, color: 'var(--navy-800)' }}>
                                {site.surveyCount}
                              </div>
                            </div>
                            <div>
                              <div style={{ color: 'var(--slate-500)', fontSize: '10px' }}>Restoration Plots</div>
                              <div style={{ fontWeight: 600, color: 'var(--navy-800)' }}>
                                {site.restorationCount}
                              </div>
                            </div>
                          </div>

                          <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginBottom: '8px' }}>
                            {site.lastSurveyDate
                              ? `Last surveyed: ${new Date(site.lastSurveyDate).toLocaleDateString()}`
                              : 'No field surveys logged yet'}
                          </div>

                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
                            onClick={() => setSelectedSiteId(site._id)}
                          >
                            <HiOutlineEye size={14} /> Inspect Chronological Timeline
                          </button>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          )}
        </div>
      ) : (
        /* Tabular Directory Fallback */
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Site Designation</th>
                  <th>Region / State</th>
                  <th>GPS Coordinates</th>
                  <th>Surveys</th>
                  <th>Latest Coral Cover</th>
                  <th>Latest Bleaching</th>
                  <th>Taxa Sightings</th>
                  <th>Restoration Activity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sites.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--slate-500)' }}>
                      No Indian reef sites matched the selected criteria.
                    </td>
                  </tr>
                ) : (
                  sites.map((site) => (
                    <tr key={site._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{site.name}</div>
                        {site.isMarineProtectedArea && (
                          <span style={{ fontSize: '11px', color: 'var(--teal-600)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <HiOutlineShieldCheck size={12} /> Marine Protected Area
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-navy">{site.region}</span>
                        <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>{site.stateOrUT}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--slate-600)' }}>
                        {site.coordinates?.lat.toFixed(3)}°N, {site.coordinates?.lng.toFixed(3)}°E
                      </td>
                      <td>{site.surveyCount}</td>
                      <td>
                        {site.latestCoralCover !== null ? (
                          <strong style={{ color: 'var(--teal-600)' }}>{site.latestCoralCover}%</strong>
                        ) : '—'}
                      </td>
                      <td>
                        {site.latestBleaching !== null ? (
                          <span className={`badge ${site.latestBleaching >= 30 ? 'badge-danger' : site.latestBleaching >= 10 ? 'badge-warning' : 'badge-green'}`}>
                            {site.latestBleaching}%
                          </span>
                        ) : '—'}
                      </td>
                      <td>{site.speciesRecordCount} observed</td>
                      <td>
                        {site.restorationCount > 0 ? (
                          <span className="badge badge-teal">{site.restorationCount} plot(s)</span>
                        ) : (
                          <span style={{ color: 'var(--slate-400)', fontSize: '12px' }}>None</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedSiteId(site._id)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Site Detail Timeline Modal */}
      {selectedSiteId && (
        <SiteDetailModal
          siteId={selectedSiteId}
          onClose={() => setSelectedSiteId(null)}
        />
      )}
    </div>
  );
}
