import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineEnvelopeOpen
} from 'react-icons/hi2';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-icon"
        style={{
          position: 'relative',
          background: open ? 'var(--sand-200)' : 'transparent',
          border: '1px solid var(--sand-300)',
          borderRadius: '8px',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--navy-800)'
        }}
        title="Notifications"
        aria-label="View notifications"
      >
        <HiOutlineBell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #ffffff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '360px',
            maxWidth: '90vw',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--sand-300)',
            zIndex: 1050,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--sand-300)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--sand-50)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '14px', color: 'var(--navy-900)' }}>Notifications</strong>
              {unreadCount > 0 && (
                <span className="badge badge-coral" style={{ fontSize: '10px', padding: '2px 6px' }}>
                  {unreadCount} unread
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '11px',
                  color: 'var(--teal-600)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <HiOutlineCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--slate-500)',
                  fontSize: '13px'
                }}
              >
                <HiOutlineEnvelopeOpen size={28} style={{ color: 'var(--sand-400)', marginBottom: '8px' }} />
                <div>No notifications yet</div>
                <div style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '4px' }}>
                  Admin verification updates on your data submissions will appear here.
                </div>
              </div>
            ) : (
              notifications.map((n) => {
                const isVerified = n.status === 'verified';
                const isRejected = n.status === 'rejected';

                return (
                  <div
                    key={n._id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--sand-200)',
                      backgroundColor: n.read ? '#ffffff' : 'rgba(14, 124, 134, 0.04)',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      {isVerified ? (
                        <HiOutlineCheckCircle size={20} style={{ color: '#10b981' }} />
                      ) : isRejected ? (
                        <HiOutlineXCircle size={20} style={{ color: '#ef4444' }} />
                      ) : (
                        <HiOutlineBell size={20} style={{ color: 'var(--teal-500)' }} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--navy-900)' }}>
                          {n.title}
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--slate-400)', flexShrink: 0 }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--slate-700)', lineHeight: 1.4 }}>
                        {n.message}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <span
                          className={`badge ${isVerified ? 'badge-green' : isRejected ? 'badge-coral' : 'badge-navy'}`}
                          style={{ fontSize: '10px', textTransform: 'capitalize' }}
                        >
                          {n.entityType} • {n.status}
                        </span>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {!n.read && (
                            <button
                              onClick={() => markAsRead(n._id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--teal-600)',
                                cursor: 'pointer',
                                fontSize: '11px',
                                padding: '2px 4px'
                              }}
                              title="Mark read"
                            >
                              Read
                            </button>
                          )}
                          <button
                            onClick={() => removeNotification(n._id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--slate-400)',
                              cursor: 'pointer',
                              padding: '2px'
                            }}
                            title="Dismiss"
                          >
                            <HiOutlineTrash size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
