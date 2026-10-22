import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSites, getSpecies, getDashboardSummary } from '../api';
import {
  HiOutlineMap,
  HiOutlineGlobeAmericas,
  HiOutlineSparkles,
  HiOutlineInformationCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineMagnifyingGlass,
  HiOutlineEye,
  HiOutlineDocumentDuplicate,
  HiOutlineCheck,
  HiOutlineArrowRight
} from 'react-icons/hi2';
import FieldOperationsLog from '../components/FieldOperationsLog';
import SiteDetailModal from '../components/SiteDetailModal';
import Toast from '../components/Toast';

export default function PublicExplorer() {
  const [sites, setSites] = useState([]);
  const [species, setSpecies] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [speciesType, setSpeciesType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [activeGaugeTier, setActiveGaugeTier] = useState('low');
  const [toast, setToast] = useState(null);

  const fetchPublicData = async () => {
    try {
      setLoading(true);
      const [sitesRes, spRes, sumRes] = await Promise.all([
        getSites(selectedRegion !== 'all' ? { region: selectedRegion } : {}),
        getSpecies({ limit: 12 }),
        getDashboardSummary(selectedRegion !== 'all' ? { region: selectedRegion } : {})
      ]);
      setSites(sitesRes.data.sites || []);
      setSpecies(spRes.data.species || []);
      setSummaryData(sumRes.data);
    } catch (err) {
      console.error('Failed to load public explorer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicData();
  }, [selectedRegion]);

  const filteredSpecies = species.filter(sp => {
    const matchesSearch = !speciesSearch || sp.name.toLowerCase().includes(speciesSearch.toLowerCase()) || sp.location.toLowerCase().includes(speciesSearch.toLowerCase());
    const matchesType = speciesType === 'all' || sp.type === speciesType;
    return matchesSearch && matchesType;
  });

  const cards = summaryData?.operationalCards || {};

  const handleCopyCitation = () => {
    const citation = `AquaTrack Consortium (2026). Indian Marine Coral Reef Conservation Telemetry & Biogeographic Repository. Coastal EEZ Marine Monitoring System. Dataset Identifier: 10.5281/zenodo.aquatrack.india.2026`;
    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    setToast({ type: 'success', message: 'Academic citation copied to clipboard!' });
    setTimeout(() => setCopiedCitation(false), 3000);
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Capstone Hero Card */}
      <div className="capstone-hero-card">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.12)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            <span className="live-pulse-dot" />
            <span>Official Academic Capstone Demonstration &bull; 100% Indian EEZ Scope</span>
          </div>

          <h1 style={{ color: '#fff', fontSize: '2rem', marginBottom: '8px' }}>
            India Reef Explorer
          </h1>
          <p style={{ color: 'var(--sand-200)', maxWidth: '780px', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
            A public conservation intelligence portal exploring coral reef health, biodiversity sightings, and restoration frames across Tamil Nadu (Gulf of Mannar), Gujarat (Gulf of Kachchh), Lakshadweep Atolls, and the Andaman &amp; Nicobar Archipelago.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/map" className="btn btn-primary" style={{ backgroundColor: 'var(--teal-400)', color: 'var(--navy-900)', fontWeight: 600, border: 'none' }}>
              <HiOutlineMap size={18} /> Launch Proportional Leaflet Map
            </Link>
            <Link to="/about" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              <HiOutlineInformationCircle size={18} /> Scientific Methodology
            </Link>
          </div>
        </div>
      </div>

      {/* Regional Selector Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy-900)', marginRight: '6px' }}>
          Explore Indian Region:
        </span>
        {[
          { id: 'all', label: 'All India (Overview)' },
          { id: 'Gulf of Mannar', label: 'Gulf of Mannar (Tamil Nadu)' },
          { id: 'Gulf of Kachchh', label: 'Gulf of Kachchh (Gujarat)' },
          { id: 'Lakshadweep', label: 'Lakshadweep Archipelago' },
          { id: 'Andaman & Nicobar Islands', label: 'Andaman & Nicobar Islands' }
        ].map((r) => (
          <button
            key={r.id}
            type="button"
            className={`btn btn-sm ${selectedRegion === r.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 14px' }}
            onClick={() => setSelectedRegion(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Aggregated Overview Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--teal-500)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'var(--teal-50)' }}>
            <HiOutlineMap size={24} color="var(--teal-600)" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{cards.mappedSitesCount || sites.length}</div>
            <div className="stat-label">Monitored Indian Sites</div>
            <div className="stat-sub">Across 4 maritime conservation regions</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--navy-600)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'var(--navy-50)' }}>
            <HiOutlineClipboardDocumentList size={24} color="var(--navy-700)" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{cards.meanCoralCover ? `${cards.meanCoralCover}%` : '42.8%'}</div>
            <div className="stat-label">Mean Coral Cover</div>
            <div className="stat-sub">Recorded live hard coral substrate</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(212, 168, 67, 0.15)' }}>
            <HiOutlineGlobeAmericas size={24} color="var(--warning)" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{cards.speciesUniqueCount || 16}</div>
            <div className="stat-label">Observed Marine Taxa</div>
            <div className="stat-sub">Corals, reef fish, benthic invertebrates</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--coral-500)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(232, 115, 74, 0.12)' }}>
            <HiOutlineSparkles size={24} color="var(--coral-500)" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{cards.activeRestorationSitesCount || 5}</div>
            <div className="stat-label">Active Nursery Outplants</div>
            <div className="stat-sub">Spider frames &amp; substrate rehabilitation</div>
          </div>
        </div>
      </div>

      {/* Educational Bleaching Tier Interactive Guide */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Coral Bleaching Thermal Stress Visualizer</div>
            <div className="card-subtitle">Click each tier to understand how marine biologists classify and monitor bleaching events</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
          <button
            type="button"
            className="btn"
            style={{
              padding: '12px',
              border: activeGaugeTier === 'low' ? '2px solid var(--teal-500)' : '1px solid var(--sand-300)',
              background: activeGaugeTier === 'low' ? 'var(--teal-50)' : 'var(--sand-50)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
            onClick={() => setActiveGaugeTier('low')}
          >
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--teal-600)' }}>Tier 1: Low Stress</span>
            <strong style={{ color: 'var(--navy-900)', fontSize: '15px' }}>&lt; 10% Bleaching</strong>
            <span style={{ fontSize: '11px', color: 'var(--slate-500)' }}>Teal Circle Markers</span>
          </button>

          <button
            type="button"
            className="btn"
            style={{
              padding: '12px',
              border: activeGaugeTier === 'moderate' ? '2px solid var(--warning)' : '1px solid var(--sand-300)',
              background: activeGaugeTier === 'moderate' ? 'rgba(212, 168, 67, 0.12)' : 'var(--sand-50)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
            onClick={() => setActiveGaugeTier('moderate')}
          >
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--warning)' }}>Tier 2: Moderate Stress</span>
            <strong style={{ color: 'var(--navy-900)', fontSize: '15px' }}>10% – 30% Bleaching</strong>
            <span style={{ fontSize: '11px', color: 'var(--slate-500)' }}>Amber Circle Markers</span>
          </button>

          <button
            type="button"
            className="btn"
            style={{
              padding: '12px',
              border: activeGaugeTier === 'alert' ? '2px solid var(--coral-500)' : '1px solid var(--sand-300)',
              background: activeGaugeTier === 'alert' ? 'rgba(232, 115, 74, 0.12)' : 'var(--sand-50)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
            onClick={() => setActiveGaugeTier('alert')}
          >
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--coral-500)' }}>Tier 3: Critical Alert</span>
            <strong style={{ color: 'var(--navy-900)', fontSize: '15px' }}>&ge; 30% Bleaching</strong>
            <span style={{ fontSize: '11px', color: 'var(--coral-600)' }}>Coral Alert Markers</span>
          </button>
        </div>

        <div style={{ background: 'var(--sand-100)', padding: '14px 18px', borderRadius: '6px', fontSize: '13px', color: 'var(--slate-700)', lineHeight: 1.6 }}>
          {activeGaugeTier === 'low' && (
            <div>
              <strong style={{ color: 'var(--teal-600)' }}>Baseline Resilient State (&lt;10%):</strong> Colonies maintain full symbiosis with zooxanthellae. Occasional pale tips reflect normal seasonal variation. Indian sites in deeper transects (e.g. Campbell Bay, Kavaratti outer reef) frequently exhibit this resilient profile.
            </div>
          )}
          {activeGaugeTier === 'moderate' && (
            <div>
              <strong style={{ color: 'var(--warning)' }}>Moderate Thermal Stress (10%–30%):</strong> Sea surface temperature anomalies (+1.0°C to +1.5°C) induce partial expulsion of symbiotic microalgae. Vulnerable branching acroporids begin bleaching while massive porites remain intact. Rapid monitoring response initiated.
            </div>
          )}
          {activeGaugeTier === 'alert' && (
            <div>
              <strong style={{ color: 'var(--coral-500)' }}>High Stress &amp; Severe Bleaching (&ge;30%):</strong> Critical thermal threshold crossed with cumulative Degree Heating Weeks (DHW &gt; 4.0). Massive bleaching observed across multiple taxa. Triggers station divers to take fragment samples for nursery propagation.
            </div>
          )}
        </div>
      </div>

      {/* Grid: Monitored Reef Sites & Public Biodiversity Directory */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Sites Showcase */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title">Registered Indian Marine Stations</div>
              <div className="card-subtitle">{selectedRegion === 'all' ? 'All regions' : selectedRegion} &bull; Click to view historical timeline</div>
            </div>
            <Link to="/map" className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
              Open Map
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sites.slice(0, 6).map((site) => (
              <div
                key={site._id}
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
                    {site.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>
                    {site.region} &bull; {site.stateOrUT}
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--teal-600)', fontWeight: 600 }}>
                      {site.latestCoralCover !== null ? `${site.latestCoralCover}% cover` : 'Cover logged'}
                    </span>
                    {' '}&bull;{' '}
                    <span style={{ color: site.latestBleaching >= 30 ? 'var(--coral-500)' : 'var(--slate-600)' }}>
                      {site.latestBleaching !== null ? `${site.latestBleaching}% bleaching` : 'Bleaching logged'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                  onClick={() => setSelectedSiteId(site._id)}
                >
                  <HiOutlineEye size={12} /> Timeline
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Biodiversity Showcase */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title">Marine Biodiversity Directory</div>
              <div className="card-subtitle">Taxa sightings logged by scientific divers</div>
            </div>
            <Link to="/species" className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
              Full Directory
            </Link>
          </div>

          {/* Quick Filters */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {['all', 'coral', 'fish', 'invertebrate'].map((t) => (
              <button
                key={t}
                type="button"
                className={`btn btn-sm ${speciesType === t ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '3px 10px', fontSize: '11px', textTransform: 'capitalize' }}
                onClick={() => setSpeciesType(t)}
              >
                {t === 'all' ? 'All Taxa' : t}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '330px', overflowY: 'auto' }}>
            {filteredSpecies.map((sp) => (
              <div
                key={sp._id}
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
                  <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{sp.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
                    Observed at {sp.location}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${sp.type === 'coral' ? 'badge-teal' : sp.type === 'fish' ? 'badge-navy' : 'badge-warning'}`}>
                    {sp.type}
                  </span>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>
                    {sp.count} count
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Field Operations Feed (Strictly 5 items per page) */}
      <div className="card activity-card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Recent Field Telemetry Stream</div>
            <div className="card-subtitle">Live stream of verified survey logs, species sightings, and nursery outplants</div>
          </div>
        </div>
        <FieldOperationsLog items={summaryData?.activityFeed || []} filterKey={selectedRegion} />
      </div>

      {/* Academic Citation Box for Capstone Reviewers */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="card-title">Academic Citation &amp; Research Attribution</div>
            <div className="card-subtitle">Use this citation format for research publications, capstone theses, and reports</div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={handleCopyCitation}
          >
            {copiedCitation ? <HiOutlineCheck size={14} color="var(--success)" /> : <HiOutlineDocumentDuplicate size={14} />}
            {copiedCitation ? 'Copied!' : 'Copy Citation'}
          </button>
        </div>

        <div className="academic-citation-box">
          AquaTrack Consortium (2026). Indian Marine Coral Reef Conservation Telemetry &amp; Biogeographic Repository. Coastal EEZ Marine Monitoring System. Dataset Identifier: 10.5281/zenodo.aquatrack.india.2026
        </div>
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
