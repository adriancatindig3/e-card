import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { GoogleMark } from '../components/Icons';
import { formatAuthError } from '../lib/errors';
import { auth, googleProvider, missingConfig } from '../lib/firebase';

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const missing = missingConfig();

  async function continueWithGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="screen">
      <p className="brand">Digital Card</p>
      <h1>A public page for your work.</h1>
      <p className="lede">One link, a QR code, and a layout you choose.</p>
      <div className="preview-card" aria-hidden="true">
        <div className="preview-cover" />
        <div className="preview-body">
          <div className="preview-avatar" />
          <strong>Your name</strong>
          <p>Headline</p>
        </div>
      </div>
      {missing.length > 0 ? (
        <p className="form-error">Missing configuration: {missing.join(', ')}.</p>
      ) : (
        <button className="btn btn-primary" type="button" onClick={continueWithGoogle} disabled={busy}>
          <GoogleMark />
          {busy ? 'Waiting for Google…' : 'Continue with Google'}
        </button>
      )}
      {error ? (
        <p className="form-error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      ) : null}
      <p className="note">New accounts stay hidden until an admin approves them, or you redeem an invite code.</p>
    </main>
  );
}
