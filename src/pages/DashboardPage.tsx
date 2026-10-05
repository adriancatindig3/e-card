import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firebaseCode } from '../lib/errors';
import { normalizeSlug } from '../lib/slug';
import { changeSlug } from '../lib/users';

export function DashboardPage() {
  const { profile, signOutUser } = useAuth();
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
    <main className="screen">
      <div className="header-row">
        <p className="brand">Digital Card</p>
        <button className="btn btn-plain" type="button" onClick={() => void signOutUser()}>
          Sign out
        </button>
      </div>
      <h1>Your card</h1>
      <p className="lede">{profile.displayName}</p>
      <div className="url-line" style={{ marginTop: 22 }}>
        <div className="url-box">
          <span>{url}</span>
        </div>
        <button className="btn btn-quiet" type="button" onClick={() => void copy()}>
          Copy
        </button>
      </div>
      {message ? <p className="note">{message}</p> : null}
      <div className="qr-wrap">
        <QRCodeSVG value={url} size={168} bgColor="#ffffff" fgColor="#1d1d1f" level="M" />
        <p>Scan to open your card</p>
      </div>
      <div className="stack">
        <Link className="btn btn-primary" to="/app/edit">
          Edit card
        </Link>
        {saved ? (
          <Link className="btn btn-quiet" to="/app/templates">
            Choose layout
          </Link>
        ) : (
          <p className="note">Save your card before choosing a layout.</p>
        )}
      </div>
      <form className="section stack" onSubmit={saveSlug}>
        <label className="field">
          <span>Public link</span>
          <input value={slug} onChange={(event) => setSlug(event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        </label>
        {error ? <p className="field-error">{error}</p> : null}
        <button className="btn btn-quiet" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save link'}
        </button>
      </form>
    </main>
  );
}
