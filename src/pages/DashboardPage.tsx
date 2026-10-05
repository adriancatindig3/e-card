import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firebaseCode } from '../lib/errors';
import { normalizeSlug } from '../lib/slug';
import { changeSlug } from '../lib/users';

export function DashboardPage() {
  const { profile } = useAuth();
  const [slug, setSlug] = useState(profile?.slug ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const saved = Boolean(profile?.updatedAt);
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const url = profile ? `${origin}/c/${profile.slug}` : '';

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Copied');
    } catch {
      setMessage('Select the link and copy it.');
    }
  }

  async function saveSlug(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setError(null);
    setMessage(null);
    const next = normalizeSlug(slug);
    if (!next) {
      setError('Use lowercase letters, numbers, and hyphens.');
      return;
    }
    setBusy(true);
    try {
      await changeSlug(profile.uid, profile.slug, next);
      setMessage('Link updated');
    } catch (err) {
      if (err instanceof Error && !firebaseCode(err)) setError(err.message);
      else setError('That link could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  if (!profile) return null;

  return (
    <main className="screen dashboard">
      <h1>Dashboard</h1>
      <p className="lede">{profile.displayName}</p>
      <div className="dash-grid">
        <section className="panel dash-panel">
          <h2>Your card</h2>
          <div className="url-line">
            <div className="url-box">
              <span>{url}</span>
            </div>
            <button className="btn btn-quiet" type="button" onClick={() => void copy()}>
              Copy
            </button>
          </div>
          {message ? <p className="note">{message}</p> : null}
          <form className="stack" onSubmit={saveSlug}>
            <label className="field">
              <span>Public link</span>
              <input value={slug} onChange={(event) => setSlug(event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            </label>
            {error ? <p className="field-error">{error}</p> : null}
            <button className="btn btn-quiet" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save link'}
            </button>
          </form>
          <div className="stack">
            <Link className="btn btn-dark" to="/app/edit">
              Edit profile
            </Link>
            {saved ? (
              <Link className="btn btn-quiet" to="/app/templates">
                Themes
              </Link>
            ) : (
              <p className="note">Save your profile before choosing a theme.</p>
            )}
          </div>
        </section>
        <section className="panel dash-panel qr-panel">
          <h2>My QR</h2>
          <div className="qr-wrap">
            <QRCodeSVG value={url} size={196} bgColor="#ffffff" fgColor="#1d1d1f" level="M" />
            <p>Scan to open your card</p>
          </div>
        </section>
      </div>
    </main>
  );
}
