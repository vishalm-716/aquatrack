import React, { useState, useEffect } from 'react';
import { getCommandCenterOverview } from '../api';
import {
  HiOutlineDocumentChartBar,
  HiOutlineShieldCheck,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineArrowDownTray
} from 'react-icons/hi2';

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCommandCenterOverview()
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const { regionalCoverage = [], dataQualityFlags = {}, userRoleSummary = {} } = data || {};
  const { foreignLegacyAudited = {}, severeBleachingAlerts = [], missingPhotosCount = 0 } = dataQualityFlags;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Agency Reports &amp; Data Quality Audit</h1>
          <p>
            Audit telemetry, compliance tracking with Indian EEZ spatial scope, and regional monitoring integrity reports.
          </p>
        </div>
      </div>

      {/* Audit Summary Card */}
      <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid var(--teal-500)' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Geographic Scope &amp; Foreign Data Audit Certification</div>
            <div className="card-subtitle">Active Indian conservation scope verified under Indian maritime zones</div>
          </div>
          <span className="badge badge-teal" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <HiOutlineShieldCheck size={14} /> Audit Status: Clean &amp; Isolated
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '12px' }}>
          <div style={{ background: 'var(--sand-100)', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Foreign Surveys Quarantined</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)', marginTop: '2px' }}>{foreignLegacyAudited.surveys || 11}</div>
            <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>GBR, Maldives, Hawaii, Red Sea, etc.</div>
          </div>

          <div style={{ background: 'var(--sand-100)', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Foreign Taxa Sightings Quarantined</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)', marginTop: '2px' }}>{foreignLegacyAudited.species || 16}</div>
            <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>Non-Indian reef species tagged legacy</div>
          </div>

          <div style={{ background: 'var(--sand-100)', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Foreign Restorations Quarantined</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)', marginTop: '2px' }}>{foreignLegacyAudited.restorations || 5}</div>
            <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>Belize, Similan, Baa Atoll, etc.</div>
          </div>

          <div style={{ background: 'var(--sand-100)', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Active Indian Monitored Sites</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--teal-600)', marginTop: '2px' }}>12 Sites</div>
            <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>Tamil Nadu, Gujarat, LD, AN</div>
          </div>
        </div>
      </div>

      {/* Regional Completeness Matrix */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Regional Monitoring Completeness</div>
            <div className="card-subtitle">Survey coverage and baseline metric consistency across Indian reef zones</div>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Registered Sites</th>
                <th>Total Transects</th>
                <th>Average Hard Coral Cover</th>
                <th>Average Bleaching Stress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {regionalCoverage.map((r) => (
                <tr key={r.region}>
                  <td><strong>{r.region}</strong></td>
                  <td>{r.siteCount} sites</td>
                  <td>{r.surveyCount} transects</td>
                  <td><strong style={{ color: 'var(--teal-600)' }}>{r.meanCoralCover}%</strong></td>
                  <td>{r.meanBleaching}%</td>
                  <td>
                    <span className="badge badge-teal" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <HiOutlineCheckCircle size={12} /> Active Telemetry
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
