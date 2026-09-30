import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardSummary } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineGlobeAmericas,
  HiOutlineExclamationTriangle,
  HiOutlineArrowTrendingUp,
  HiOutlinePlusCircle,
  HiOutlineSparkles
} from 'react-icons/hi2';
import { SkeletonCard, SkeletonChart } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const SPECIES_COLORS = {
  coral: '#0E7C86',
  fish: '#2EC4B6',
  invertebrate: '#E8734A'
};

export default function Dashboard() {
  const { user, canWrite } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardSummary();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Unable to retrieve conservation telemetry. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Conservation Telemetry Overview</h1>
          <p>Aggregated real-time metrics across registered marine observation zones</p>
        </div>
        <div className="dashboard-grid">
          <div className="dashboard-stats">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="chart-card wide"><SkeletonChart /></div>
          <div className="activity-card"><SkeletonCard /></div>
          <div className="chart-card wide"><SkeletonChart /></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card error-state" style={{ margin: '40px auto', maxWidth: '500px' }}>
        <HiOutlineExclamationTriangle style={{ fontSize: '40px', color: 'var(--danger)', margin: '0 auto 12px' }} />
        <h3>Telemetry Retrieval Failed</h3>
        <p>{error}</p>
        <button className="btn btn-primary btn-sm" onClick={fetchSummary}>Retry Telemetry Query</button>
      </div>
    );
  }

  const { stats, coralCoverBySite = [], bleachingTrend = [], speciesByType = [], activityFeed = [] } = data || {};

  // Compute Reef Health Index (composite metric: coral cover weighted vs bleaching impact)
  const avgCoral = stats?.avgCoralCover || 0;
  const avgBleach = stats?.avgBleaching || 0;
  const healthIndex = Math.max(0, Math.min(100, Math.round(avgCoral * 1.1 - avgBleach * 0.75)));
  
  let healthRating = 'Critical Warning';
  let healthColor = 'var(--danger)';
  if (healthIndex >= 70) {
    healthRating = 'Optimal Ecosystem Stability';
    healthColor = 'var(--teal-300)';
  } else if (healthIndex >= 50) {
    healthRating = 'Moderate Ecological Stress';
    healthColor = 'var(--warning)';
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Conservation Telemetry Overview</h1>
          <p>
            Logged as <strong>{user?.name}</strong> ({user?.role}) • Real-time field survey synthesis & coral stress indicators
          </p>
        </div>
        {canWrite && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/surveys" className="btn btn-primary">
              <HiOutlinePlusCircle size={18} />
              Log Reef Survey
            </Link>
          </div>
        )}
      </div>

      {/* Asymmetric Dashboard Grid */}
      <div className="dashboard-grid">
        
        {/* Asymmetric Stats Row */}
        <div className="dashboard-stats">
          
          {/* Hero Reef Health Index Metric Card */}
          <div className="dashboard-hero-stat">
            <div className="stat-label">Composite Reef Health Index</div>
            <div className="stat-value">{healthIndex}<span style={{ fontSize: '18px', opacity: 0.7 }}>/100</span></div>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: healthColor }}></span>
              <span style={{ fontSize: '12px', color: healthColor, fontWeight: 500 }}>{healthRating}</span>
            </div>
            <div className="stat-sub">Synthesized from {stats?.totalSurveys || 0} geo-referenced surveys</div>
          </div>

          {/* Average Coral Cover */}
          <div className="stat-card">
            <div className="stat-icon teal">
              <HiOutlineArrowTrendingUp size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Avg Coral Cover</div>
              <div className="stat-value">{avgCoral}%</div>
              <div className="stat-change" style={{ color: avgCoral > 50 ? 'var(--success)' : 'var(--coral-500)' }}>
                {avgCoral > 50 ? 'Above target benchmark' : 'Below resilience threshold'}
              </div>
            </div>
          </div>

          {/* Bleaching Stress */}
          <div className="stat-card">
            <div className="stat-icon coral">
              <HiOutlineExclamationTriangle size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Bleaching Stress</div>
              <div className="stat-value">{avgBleach}%</div>
              <div className="stat-change" style={{ color: avgBleach > 20 ? 'var(--danger)' : 'var(--success)' }}>
                {avgBleach > 20 ? 'Active thermal alert' : 'Low bleaching pressure'}
              </div>
            </div>
          </div>

          {/* Species Cataloged */}
          <div className="stat-card">
            <div className="stat-icon navy">
              <HiOutlineGlobeAmericas size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Taxa Documented</div>
              <div className="stat-value">{stats?.speciesCount || 0}</div>
              <div className="stat-change" style={{ color: 'var(--slate-500)' }}>
                Across coral, fish & inverts
              </div>
            </div>
          </div>

          {/* Active Restorations */}
          <div className="stat-card">
            <div className="stat-icon green">
              <HiOutlineSparkles size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Restoration Plots</div>
              <div className="stat-value">{stats?.activeRestorationSites || 0}</div>
              <div className="stat-change" style={{ color: 'var(--success)' }}>
                Active nursery transplant sites
              </div>
            </div>
          </div>
        </div>

        {/* Coral Cover by Site Chart (Bar Chart) */}
        <div className="card chart-card wide">
          <div className="card-header">
            <div>
              <div className="card-title">Live Coral Cover vs Bleaching by Location</div>
              <div className="card-subtitle">Field survey comparisons across regional marine protected areas (%)</div>
            </div>
          </div>
          {coralCoverBySite.length === 0 ? (
            <EmptyState title="No survey site telemetry" description="Log new surveys to view site comparison bars." />
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coralCoverBySite} margin={{ top: 10, right: 20, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sand-300)" vertical={false} />
                  <XAxis
                    dataKey="location"
                    tick={{ fontSize: 11, fill: 'var(--slate-600)' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    tickFormatter={(val) => val.split('—')[1]?.trim() || val.slice(0, 16)}
                  />
                  <YAxis unit="%" tick={{ fontSize: 12, fill: 'var(--slate-600)' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid var(--sand-300)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="avgCoralCover" name="Live Coral Cover %" fill="var(--teal-500)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avgBleaching" name="Bleaching Impact %" fill="var(--coral-500)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Compact Recent Activity Feed */}
        <div className="card activity-card">
          <div className="card-header">
            <div>
              <div className="card-title">Field Operations Log</div>
              <div className="card-subtitle">Real-time submissions from research diving teams</div>
            </div>
          </div>
          {activityFeed.length === 0 ? (
            <EmptyState title="No recent activity" description="Recent survey and restoration submissions will stream here." />
          ) : (
            <div className="activity-feed">
              {activityFeed.map((item, index) => (
                <div key={index} className="activity-item">
                  <div className={`activity-dot ${item.type}`} />
                  <div className="activity-text">
                    <strong>{item.title}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
                      {item.detail}
                    </div>
                    {item.by && (
                      <div style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '2px' }}>
                        Logged by {item.by}
                      </div>
                    )}
                  </div>
                  <div className="activity-time">
                    {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bleaching Trend Over Time (Line Chart) */}
        <div className="card chart-card wide">
          <div className="card-header">
            <div>
              <div className="card-title">Temporal Bleaching & Resilience Trend</div>
              <div className="card-subtitle">Monthly trajectory of thermal stress and live coral retention</div>
            </div>
          </div>
          {bleachingTrend.length === 0 ? (
            <EmptyState title="Insufficient chronological data" description="Multiple months of survey data will reveal long-term trends." />
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bleachingTrend} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sand-300)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--slate-600)' }} />
                  <YAxis unit="%" tick={{ fontSize: 12, fill: 'var(--slate-600)' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid var(--sand-300)',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="avgBleaching"
                    name="Avg Bleaching %"
                    stroke="var(--coral-500)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'var(--coral-500)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgCoralCover"
                    name="Avg Coral Cover %"
                    stroke="var(--teal-500)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'var(--teal-500)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Species Distribution by Taxa */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Biodiversity by Taxa</div>
              <div className="card-subtitle">Distribution of documented specimens</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            {speciesByType.map((item) => (
              <div key={item.type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: 500, color: 'var(--navy-800)' }}>
                    {item.type} Specimens
                  </span>
                  <span style={{ color: 'var(--slate-500)' }}>
                    {item.totalCount} sightings ({item.uniqueSpecies} taxa)
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, item.totalCount * 0.8)}%`,
                      backgroundColor: SPECIES_COLORS[item.type] || 'var(--teal-500)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
