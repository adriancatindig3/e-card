import { useState } from 'react';
import { firebaseCode } from '../lib/errors';
import { normalizeInviteCode } from '../lib/invites';
import { redeemInvite } from '../lib/users';
import { useAuth } from '../context/AuthContext';

export function PendingPage() {
  const { user, profile, signOutUser } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function redeem(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !profile) return;
    setError(null);
    const normalized = normalizeInviteCode(code);
    if (!normalized) {
      setError('That invite code is not valid.');
      return;
    }
    setBusy(true);
    try {
      await redeemInvite(user.uid, user.email || profile.email, normalized);
    } catch (err) {
      if (err instanceof Error && !firebaseCode(err)) setError(err.message);
      else if (firebaseCode(err) === 'permission-denied') setError('That invite code could not be redeemed.');
      else setError('That invite code could not be redeemed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="screen">
      <p className="brand">Digital Card</p>
      <h1>Waiting for approval</h1>
      <p className="lede">
        An admin needs to approve {profile?.email || 'this account'} before the card can go live. If you have an
        invite code, enter it below.
      </p>
      <form className="stack" style={{ marginTop: 28 }} onSubmit={redeem}>
        <label className="field">
          <span>Invite code</span>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder="ABCD-EFGH-JKLM"
            aria-invalid={error ? true : undefined}
          />
        </label>
        {error ? (
          <p className="field-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Checking…' : 'Redeem code'}
        </button>
        <button className="btn btn-plain" type="button" onClick={() => void signOutUser()}>
          Sign out
        </button>
      </form>
    </main>
  );
}
