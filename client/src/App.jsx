import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout, ProtectedRoute } from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Surveys from './pages/Surveys';
import Species from './pages/Species';
import Restoration from './pages/Restoration';
import Admin from './pages/Admin';

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
          <Route path="/surveys" element={<Surveys />} />
          <Route path="/species" element={<Species />} />
          <Route path="/restoration" element={<Restoration />} />

          {/* Admin Protected Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <Admin />
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
