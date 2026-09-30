export function SkeletonCard() {
  return (
    <div className="card skeleton-card">
      <div className="skeleton skeleton-heading" style={{ width: '40%' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="table-container" style={{ padding: '16px' }}>
      <div className="skeleton skeleton-heading" style={{ width: '30%', marginBottom: '20px' }}></div>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div key={cIdx} className="skeleton skeleton-text" style={{ flex: 1, height: '18px' }}></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="card skeleton-chart">
      <div className="skeleton skeleton-heading" style={{ width: '35%', marginBottom: '20px' }}></div>
      <div className="skeleton" style={{ height: '180px', width: '100%', borderRadius: '4px' }}></div>
    </div>
  );
}
