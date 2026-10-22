import React from 'react';
import {
  HiOutlineInformationCircle,
  HiOutlineGlobeAmericas,
  HiOutlineShieldCheck,
  HiOutlineMapPin
} from 'react-icons/hi2';

export default function AboutData() {
  return (
    <div>
      <div className="page-header">
        <h1>About AquaTrack &amp; Indian Marine Conservation Data</h1>
        <p>Scientific background, geographic boundaries, observation methodologies, and public data notice</p>
      </div>

      {/* Notice Card */}
      <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--teal-500)', background: 'var(--sand-100)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <HiOutlineInformationCircle size={28} color="var(--teal-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '16px', color: 'var(--navy-900)', margin: '0 0 6px 0' }}>
              Public Demonstration Dataset Notice
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--slate-700)', lineHeight: 1.6, margin: 0 }}>
              AquaTrack is an operations and monitoring platform built for marine conservation workflows in India. The current records in this platform are illustrative research observations and synthetic transects modeled after real reef structures in the Gulf of Mannar, Gulf of Kachchh, Lakshadweep, and Andaman &amp; Nicobar Islands. They do not constitute official national state-of-the-environment reports or statutory environmental impact assessments.
            </p>
          </div>
        </div>
      </div>

      {/* Four Indian Marine Zones */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">India's Four Monitored Marine Reef Regions</div>
            <div className="card-subtitle">Geographic distribution and ecological characteristics</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--sand-50)', padding: '16px', borderRadius: '6px', border: '1px solid var(--sand-300)' }}>
            <h4 style={{ color: 'var(--navy-900)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiOutlineMapPin color="var(--teal-600)" /> Gulf of Mannar (Tamil Nadu)
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--slate-600)', lineHeight: 1.5, margin: 0 }}>
              Encompasses a chain of 21 islands stretching from Rameswaram to Tuticorin. Known for shallow fringing reefs, seagrass beds supporting dugongs, and branching Acropora micro-fragmentation nursery initiatives.
            </p>
          </div>

          <div style={{ background: 'var(--sand-50)', padding: '16px', borderRadius: '6px', border: '1px solid var(--sand-300)' }}>
            <h4 style={{ color: 'var(--navy-900)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiOutlineMapPin color="var(--teal-600)" /> Gulf of Kachchh (Gujarat)
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--slate-600)', lineHeight: 1.5, margin: 0 }}>
              India's northernmost marine national park, characterized by extreme tidal fluctuations (up to 5 meters) and high turbidity. Hard corals here (such as massive Porites and Favia) display exceptional thermal and salinity resilience.
            </p>
          </div>

          <div style={{ background: 'var(--sand-50)', padding: '16px', borderRadius: '6px', border: '1px solid var(--sand-300)' }}>
            <h4 style={{ color: 'var(--navy-900)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiOutlineMapPin color="var(--teal-600)" /> Lakshadweep Archipelago
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--slate-600)', lineHeight: 1.5, margin: 0 }}>
              Classic coral atolls and submerged barrier banks in the Arabian Sea. Diverse table and branching Acropora formations surrounding turquoise lagoons, monitored for thermal recovery after historical ocean warming events.
            </p>
          </div>

          <div style={{ background: 'var(--sand-50)', padding: '16px', borderRadius: '6px', border: '1px solid var(--sand-300)' }}>
            <h4 style={{ color: 'var(--navy-900)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiOutlineMapPin color="var(--teal-600)" /> Andaman &amp; Nicobar Islands
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--slate-600)', lineHeight: 1.5, margin: 0 }}>
              Over 500 oceanic islands with deep reef walls, high scleractinian coral diversity, pelagic fish aggregations, and rich benthic invertebrate biodiversity extending down to the Great Nicobar Biosphere Reserve.
            </p>
          </div>
        </div>
      </div>

      {/* Observation Methodology */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Scientific Observation Methodologies</div>
            <div className="card-subtitle">Standards followed by participating marine stations</div>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--slate-700)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <strong>1. Line-Intercept Transect (LIT) Coral Cover:</strong> Standard 20-meter or 50-meter line transects deployed along reef slopes at specified depth ranges (2m to 25m) to determine live hard coral percentage versus rubble, sand, and macroalgae.
          </div>
          <div>
            <strong>2. Bleaching Tier Visual Scale:</strong> Colony stress assessment categorizing observed bleaching incidence into &lt;10% (Low stress), 10%–30% (Moderate), and &ge;30% (Alert tier) for regional response coordination.
          </div>
          <div>
            <strong>3. Benthic Restoration Monitoring:</strong> Survivorship percentage tracking on artificial spider frames, concrete blocks, and nursery lines outplanted with micro-fragmented donor colonies.
          </div>
        </div>
      </div>
    </div>
  );
}
