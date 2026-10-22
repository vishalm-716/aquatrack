import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminCommandCenter from './AdminCommandCenter';
import ResearcherWorkspace from './ResearcherWorkspace';
import PublicExplorer from './PublicExplorer';

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminCommandCenter />;
  }

  if (user?.role === 'researcher') {
    return <ResearcherWorkspace />;
  }

  // Default for public or unauthenticated guests
  return <PublicExplorer />;
}
