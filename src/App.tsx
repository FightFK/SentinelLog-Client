import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LogsPage from './pages/LogsPage';
import LogDetailPage from './pages/LogDetailPage';
import ThreatsPage from './pages/ThreatsPage';
import PendingAlertsPage from './pages/PendingAlertsPage';
import DecisionsPage from './pages/DecisionsPage';
import AgentsPage from './pages/AgentsPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import { Spinner } from './components/ui';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#080c1a] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

      <Route path="/" element={<RequireAuth><Layout><DashboardPage /></Layout></RequireAuth>}>
      </Route>

      <Route path="/dashboard" element={
        <RequireAuth><Layout><DashboardPage /></Layout></RequireAuth>
      } />
      <Route path="/logs" element={
        <RequireAuth><Layout><LogsPage /></Layout></RequireAuth>
      } />
      <Route path="/logs/:id" element={
        <RequireAuth><Layout><LogDetailPage /></Layout></RequireAuth>
      } />
      <Route path="/threats" element={
        <RequireAuth><Layout><ThreatsPage /></Layout></RequireAuth>
      } />
      <Route path="/profile" element={
        <RequireAuth><Layout><ProfilePage /></Layout></RequireAuth>
      } />

      {/* Admin only */}
      <Route path="/pending" element={
        <RequireAuth><RequireAdmin><Layout><PendingAlertsPage /></Layout></RequireAdmin></RequireAuth>
      } />
      <Route path="/decisions" element={
        <RequireAuth><RequireAdmin><Layout><DecisionsPage /></Layout></RequireAdmin></RequireAuth>
      } />
      <Route path="/agents" element={
        <RequireAuth><RequireAdmin><Layout><AgentsPage /></Layout></RequireAdmin></RequireAuth>
      } />
      <Route path="/users" element={
        <RequireAuth><RequireAdmin><Layout><UsersPage /></Layout></RequireAdmin></RequireAuth>
      } />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

