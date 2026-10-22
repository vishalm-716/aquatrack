import React, { useState, useEffect } from 'react';
import EmptyState from './EmptyState';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

export default function FieldOperationsLog({ items = [], filterKey = '' }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset to page 1 when filterKey or the underlying list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterKey, items.length]);

  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="No activity recorded"
        description="Recent survey, species sighting, and restoration submissions will stream here."
      />
    );
  }

  const total = items.length;
  const totalPages = Math.ceil(total / itemsPerPage);
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const startIdx = (safePage - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, total);
  const currentItems = items.slice(startIdx, endIdx);

  const rangeLabel =
    startIdx + 1 === endIdx
      ? `${startIdx + 1} of ${total}`
      : `${startIdx + 1}–${endIdx} of ${total}`;

  const handlePrev = () => {
    if (safePage > 1) setCurrentPage(safePage - 1);
  };

  const handleNext = () => {
    if (safePage < totalPages) setCurrentPage(safePage + 1);
  };

  return (
    <div className="field-operations-log-container">
      {/* 5 items per page */}
      <div className="activity-feed">
        {currentItems.map((item, idx) => (
          <div key={`${item.type}-${startIdx + idx}`} className="activity-item">
            <div className={`activity-dot ${item.type}`} />
            <div className="activity-text">
              <strong>{item.title}</strong>
              <div style={{ fontSize: '12px', color: 'var(--slate-600)', marginTop: '2px' }}>
                {item.detail}
              </div>
              {item.by && (
                <div style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '2px' }}>
                  Logged by {item.by}
                </div>
              )}
            </div>
            <div className="activity-time">
              {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Bar */}
      <div
        className="field-log-pagination"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          marginTop: '12px',
          borderTop: '1px solid var(--slate-100)',
          fontSize: '13px',
          color: 'var(--slate-600)'
        }}
      >
        <span style={{ fontWeight: 500 }}>
          Showing {rangeLabel}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handlePrev}
            disabled={safePage <= 1}
            aria-label="Previous page of operations log"
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              opacity: safePage <= 1 ? 0.45 : 1,
              cursor: safePage <= 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <HiOutlineChevronLeft size={14} /> Previous
          </button>

          <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
            Page {safePage} of {totalPages}
          </span>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleNext}
            disabled={safePage >= totalPages}
            aria-label="Next page of operations log"
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              opacity: safePage >= totalPages ? 0.45 : 1,
              cursor: safePage >= totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next <HiOutlineChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
