import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, getVerificationQueue } from '../api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminPendingCount, setAdminPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUserNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setAdminPendingCount(0);
      return;
    }
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);

      // If admin, also fetch live pending verification queue count
      if (user.role === 'admin') {
        try {
          const qRes = await getVerificationQueue();
          setAdminPendingCount(qRes.data.totalPending || 0);
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      // Silently handle polling failure
    }
  }, [user]);

  useEffect(() => {
    fetchUserNotifications();
    const interval = setInterval(fetchUserNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchUserNotifications]);

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const removeNotification = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      fetchUserNotifications();
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        adminPendingCount,
        fetchNotifications: fetchUserNotifications,
        markAsRead,
        markAllAsRead,
        removeNotification,
        loading
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
