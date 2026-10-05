import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { useAuth } from './context/AuthContext';
import { adminEmails, isAllowlistedAdmin } from './lib/admin';
import { AdminPage } from './pages/AdminPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { LoginPage } from './pages/LoginPage';
import { PausedPage } from './pages/PausedPage';
import { PendingPage } from './pages/PendingPage';
import { PublicCardPage } from './pages/PublicCardPage';
import { TemplatesPage } from './pages/TemplatesPage';

function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="center-screen">
      <p className="muted">{label}</p>
    </div>
  );
}

function SetupIssue() {
  const { setupError, retrySetup, signOutUser } = useAuth();
  return (
    <main className="screen">
      <h1>Profile not ready</h1>
      <p className="lede">{setupError}</p>
      <div className="stack" style={{ marginTop: 24 }}>
        <button className="btn btn-primary" type="button" onClick={retrySetup}>
          Try again
        </button>
        <button className="btn btn-plain" type="button" onClick={() => void signOutUser()}>
          Sign out
        </button>
      </div>
    </main>
  );
}

function homeFor(role: string, status: string, email: string): string {
  if (role === 'admin' && status === 'approved' && isAllowlistedAdmin(email)) return '/admin';
  if (status === 'paused') return '/paused';
  if (status === 'approved') return '/app';
  return '/pending';
}

function Home() {
  const { user, profile, loading, setupError } = useAuth();
  if (loading) return <Loading />;
  if (setupError) return <SetupIssue />;
  if (!user) return <LoginPage />;
  if (!profile) return <Loading label="Setting up your card" />;
  return <Navigate to={homeFor(profile.role, profile.status, profile.email)} replace />;
}

function PendingRoute() {
  const { user, profile, loading, setupError } = useAuth();
  if (loading) return <Loading />;
  if (setupError) return <SetupIssue />;
  if (!user) return <Navigate to="/" replace />;
  if (!profile) return <Loading label="Setting up your card" />;
  if (profile.status !== 'pending') return <Navigate to={homeFor(profile.role, profile.status, profile.email)} replace />;
  return <PendingPage />;
}

function PausedRoute() {
  const { user, profile, loading, setupError } = useAuth();
  if (loading) return <Loading />;
  if (setupError) return <SetupIssue />;
  if (!user) return <Navigate to="/" replace />;
  if (!profile) return <Loading label="Setting up your card" />;
  if (profile.status !== 'paused') return <Navigate to={homeFor(profile.role, profile.status, profile.email)} replace />;
  return <PausedPage />;
}

function ApprovedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading, setupError } = useAuth();
  if (loading) return <Loading />;
  if (setupError) return <SetupIssue />;
  if (!user) return <Navigate to="/" replace />;
  if (!profile) return <Loading label="Setting up your card" />;
  if (profile.status !== 'approved') return <Navigate to={homeFor(profile.role, profile.status, profile.email)} replace />;
  return <AppShell>{children}</AppShell>;
}

function AdminRoute() {
  const { user, profile, loading, setupError, signOutUser } = useAuth();
  if (adminEmails().length === 0) {
    return (
      <main className="screen">
        <h1>Admin is off</h1>
        <p className="lede">
          No admin emails are configured. Add an address to the allowlist and deploy Firestore rules before this
          dashboard can be used.
        </p>
        {user ? (
          <button className="btn btn-plain" type="button" onClick={() => void signOutUser()}>
            Sign out
          </button>
        ) : (
          <a href="/">Back</a>
        )}
      </main>
    );
  }
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  if (setupError) return <SetupIssue />;
  if (!profile) return <Loading label="Setting up your card" />;
  const allowed = profile.role === 'admin' && profile.status === 'approved' && isAllowlistedAdmin(profile.email);
  if (!allowed) {
    return (
      <main className="screen">
        <h1>No access</h1>
        <p className="lede">You don’t have access to the admin dashboard.</p>
        <a href={homeFor(profile.role, profile.status, profile.email)}>Back</a>
      </main>
    );
  }
  return <AdminPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pending" element={<PendingRoute />} />
      <Route path="/paused" element={<PausedRoute />} />
      <Route path="/app" element={<ApprovedRoute><DashboardPage /></ApprovedRoute>} />
      <Route path="/app/edit" element={<ApprovedRoute><EditorPage /></ApprovedRoute>} />
      <Route path="/app/templates" element={<ApprovedRoute><TemplatesPage /></ApprovedRoute>} />
      <Route path="/admin" element={<AdminRoute />} />
      <Route path="/c/:slug" element={<PublicCardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
