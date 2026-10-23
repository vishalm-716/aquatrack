import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout, ProtectedRoute } from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import IndiaMap from './pages/IndiaMap';
import Surveys from './pages/Surveys';
import Species from './pages/Species';
import Restoration from './pages/Restoration';
import Admin from './pages/Admin';
import VerificationQueue from './pages/VerificationQueue';
import AdminReports from './pages/AdminReports';
import AboutData from './pages/AboutData';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Authenticated Application Shell */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<IndiaMap />} />
          <Route path="/surveys" element={<Surveys />} />
          <Route path="/species" element={<Species />} />
          <Route path="/restoration" element={<Restoration />} />
          <Route path="/about" element={<AboutData />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verification"
            element={
              <ProtectedRoute roles={['admin']}>
                <VerificationQueue />
              </ProtectedRoute>
            }
          />
          <Route path="/verification-queue" element={<Navigate to="/admin/verification" replace />} />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminReports />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
