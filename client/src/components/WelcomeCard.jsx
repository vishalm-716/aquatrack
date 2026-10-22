import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineXMark,
  HiOutlineHandRaised,
  HiOutlineShieldCheck,
  HiOutlineBeaker,
  HiOutlineGlobeAlt
} from 'react-icons/hi2';

const ROLE_META = {
  admin: {
    greeting: 'Welcome back, Administrator',
    tagline: 'You have full control over the AquaTrack platform — manage users, verify surveys, and monitor Indian reef telemetry.',
    highlight: 'Agency Command Center',
    highlightLink: '/',
    color: 'var(--navy-800)',
    bg: 'linear-gradient(135deg, #071E2B 0%, #0B2E3D 60%, #0F3D51 100%)',
    icon: <HiOutlineShieldCheck size={28} color="#fff" />,
    tips: [
      '📋 Check the Verification Queue for pending researcher submissions',
      '🗺️  Review the India Reef Map for site-level bleaching alerts',
      '📊 Export CSV datasets from the Command Center',
    ],
  },
  researcher: {
    greeting: 'Welcome back, Field Researcher',
    tagline: 'Log transect surveys, record biodiversity sightings, and track your restoration plots across Indian reef regions.',
    highlight: 'Researcher Workspace',
    highlightLink: '/',
    color: 'var(--teal-600)',
    bg: 'linear-gradient(135deg, #0A6B74 0%, #0E7C86 60%, #14A3A8 100%)',
    icon: <HiOutlineBeaker size={28} color="#fff" />,
    tips: [
      '📝 Submit a new transect survey from the Surveys page',
      '🐠 Log new species sightings in Biodiversity',
      '🌱 Track nursery outplants in Restoration',
    ],
  },
  public: {
    greeting: 'Welcome to India Reef Explorer',
    tagline: 'Explore coral reef health data, biodiversity records, and restoration progress across India\'s four marine conservation regions.',
    highlight: 'Public Explorer',
    highlightLink: '/',
    color: 'var(--coral-500)',
    bg: 'linear-gradient(135deg, #C45A30 0%, #E8734A 60%, #F0936E 100%)',
    icon: <HiOutlineGlobeAlt size={28} color="#fff" />,
    tips: [
      '🗺️  Launch the India Reef Map to explore sites visually',
      '🔬 Browse the Marine Biodiversity Directory',
      '📄 Copy the academic citation for your research',
    ],
  },
};

const SESSION_KEY = 'aquatrack_welcome_dismissed';

export default function WelcomeCard() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Show once per browser session (not per page reload)
    const dismissed = sessionStorage.getItem(SESSION_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, [user]);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
  };

  if (!visible || !user) return null;

  const meta = ROLE_META[user.role] || ROLE_META.public;
  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div
      style={{
        background: meta.bg,
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '24px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(7, 30, 43, 0.18)',
        animation: 'slideUp 0.35s ease both',
      }}
    >
      {/* Decorative radial blob */}
      <div style={{
        position: 'absolute', top: '-60%', right: '-10%',
        width: '320px', height: '320px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Dismiss button */}
      <button
        onClick={dismiss}
        style={{
          position: 'absolute', top: '12px', right: '14px',
          background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
          width: '28px', height: '28px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', transition: 'background 0.15s',
        }}
        title="Dismiss welcome card"
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
      >
        <HiOutlineXMark size={15} />
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        {/* Icon circle */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, border: '2px solid rgba(255,255,255,0.2)'
        }}>
          {meta.icon}
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          {/* Top label */}
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.75, marginBottom: '3px' }}>
            {timeGreet} &bull; {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>

          {/* Main greeting */}
          <h2 style={{ color: '#fff', fontSize: '18px', margin: '0 0 4px 0' }}>
            <HiOutlineHandRaised size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            {timeGreet}, <strong>{user.name?.split(' ')[0] || 'Friend'}</strong>!
          </h2>

          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', margin: '0 0 12px 0', lineHeight: 1.55, maxWidth: '620px' }}>
            {meta.tagline}
          </p>

          {/* Quick tips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {meta.tips.map((tip, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '20px', padding: '4px 12px',
                fontSize: '12px', color: 'rgba(255,255,255,0.9)',
                whiteSpace: 'nowrap',
              }}>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
