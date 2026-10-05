import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/app', label: 'Dashboard', end: true },
  { to: '/app/edit', label: 'Edit profile', end: false },
  { to: '/app/templates', label: 'Themes', end: false },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, signOutUser } = useAuth();
  const name = profile?.displayName || 'Your card';

  return (
    <div className="app-shell">
      <aside className="app-nav">
        <div className="app-nav-top">
          <p className="app-nav-brand">e-CARD</p>
          <button type="button" className="btn btn-plain app-nav-mobile-out" onClick={() => void signOutUser()}>
            Sign out
          </button>
        </div>
        <nav className="app-nav-links">
          {LINKS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-nav-user">
          <strong>{name}</strong>
          <span>{profile?.email}</span>
          <button type="button" className="btn btn-quiet" onClick={() => void signOutUser()}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="app-main">{children}</div>
    </div>
  );
}
