import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TEMPLATES, templateName } from '../components/card/templates';
import { useAuth } from '../context/AuthContext';
import { adminEmails } from '../lib/admin';
import { createInviteCode, deleteUserProfile, setUserStatus, watchInviteCodes, watchUsers } from '../lib/users';
import type { InviteCodeRecord, UserProfile, UserStatus } from '../types';

function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function asDate(value: { toDate?: () => Date } | null): Date | null {
  if (value && typeof value.toDate === 'function') return value.toDate();
  return null;
}

export function AdminPage() {
  const { user, signOutUser } = useAuth();
  const [people, setPeople] = useState<UserProfile[] | null>(null);
  const [codes, setCodes] = useState<InviteCodeRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const stopUsers = watchUsers(setPeople, (err) => setError(err.message));
    const stopCodes = watchInviteCodes(setCodes, (err) => setError(err.message));
    return () => {
      stopUsers();
      stopCodes();
    };
  }, []);

  const stats = useMemo(() => {
    const list = people ?? [];
    return {
      total: list.length,
      pending: list.filter((person) => person.status === 'pending').length,
      approved: list.filter((person) => person.status === 'approved').length,
      paused: list.filter((person) => person.status === 'paused').length,
    };
  }, [people]);

  const days = useMemo(() => {
    const counts = new Map<string, number>();
    for (const person of people ?? []) {
      const date = asDate(person.createdAt);
      if (!date) continue;
      const key = dayKey(date);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const rows: { key: string; label: string; count: number }[] = [];
    const today = new Date();
    for (let index = 13; index >= 0; index -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - index);
      const key = dayKey(date);
      rows.push({
        key,
        label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        count: counts.get(key) ?? 0,
      });
    }
    return rows;
  }, [people]);

  const templates = useMemo(() => {
    const counts = new Map(TEMPLATES.map((item) => [item.id, 0]));
    for (const person of people ?? []) {
      if (counts.has(person.templateId)) counts.set(person.templateId, (counts.get(person.templateId) ?? 0) + 1);
    }
    return TEMPLATES.map((item) => ({ ...item, count: counts.get(item.id) ?? 0 }));
  }, [people]);

  async function run(id: string, action: () => Promise<void>) {
    setError(null);
    setBusy(id);
    try {
      await action();
      setConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That action failed.');
    } finally {
      setBusy(null);
    }
  }

  async function changeStatus(person: UserProfile, status: UserStatus) {
    await run(`${person.uid}-${status}`, () => setUserStatus(person.uid, status));
  }

  const unused = (codes ?? []).filter((code) => !code.used);
  const used = (codes ?? []).filter((code) => code.used);

  return (
    <main className="screen wide">
      <div className="header-row">
        <p className="brand">Digital Card</p>
        <button className="btn btn-plain" type="button" onClick={() => void signOutUser()}>
          Sign out
        </button>
      </div>
      <h1>Admin</h1>
      {adminEmails().length === 0 ? (
        <p className="lede">No admin emails are configured. Add one and deploy the rules before anyone can manage cards.</p>
      ) : (
        <p className="lede">Approve accounts, pause public pages, and issue one-time invite codes.</p>
      )}
      <Link className="btn btn-plain" to="/app" style={{ marginTop: 8 }}>
        Your card
      </Link>
      {error ? <p className="field-error">{error}</p> : null}

      <section className="section">
        <div className="stats">
          <Stat label="Total" value={stats.total} />
          <Stat label="Pending" value={stats.pending} />
          <Stat label="Approved" value={stats.approved} />
          <Stat label="Paused" value={stats.paused} />
        </div>
      </section>

      <section className="section">
        <h2>Signups</h2>
        <ul className="quiet-list">
          {days.map((day) => (
            <li key={day.key}>
              <span>{day.label}</span>
              <span>{day.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <h2>Layouts</h2>
        <ul className="quiet-list">
          {templates.map((item) => (
            <li key={item.id}>
              <span>{item.name}</span>
              <span>{item.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <h2>People</h2>
        {people === null ? <p className="muted">Loading</p> : null}
        <div className="people">
          {(people ?? []).map((person) => (
            <article className="person" key={person.uid}>
              <div className="person-top">
                <div>
                  <h3>{person.displayName || person.email}</h3>
                  <p>{person.email}</p>
                  <p>
                    {person.status} · {templateName(person.templateId)}
                  </p>
                </div>
                <span className="status">{person.role === 'admin' ? 'Admin' : ''}</span>
              </div>
              <div className="btn-row">
                {person.status === 'pending' ? (
                  <button className="btn btn-plain" type="button" disabled={busy !== null} onClick={() => void changeStatus(person, 'approved')}>
                    Approve
                  </button>
                ) : null}
                {person.status === 'approved' && person.uid !== user?.uid ? (
                  <button className="btn btn-plain" type="button" disabled={busy !== null} onClick={() => void changeStatus(person, 'paused')}>
                    Pause
                  </button>
                ) : null}
                {person.status === 'paused' ? (
                  <button className="btn btn-plain" type="button" disabled={busy !== null} onClick={() => void changeStatus(person, 'approved')}>
                    Unpause
                  </button>
                ) : null}
                {person.uid !== user?.uid ? (
                  <button className="btn btn-plain" type="button" onClick={() => setConfirmId(person.uid)}>
                    Delete
                  </button>
                ) : null}
              </div>
              {confirmId === person.uid ? (
                <div className="confirm">
                  <p>This removes their Firestore profile and hides the public card. Their Google sign-in stays.</p>
                  <div className="btn-row">
                    <button
                      className="btn btn-quiet"
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void run(person.uid, () => deleteUserProfile(person.uid, person.slug))}
                    >
                      Delete profile
                    </button>
                    <button className="btn btn-plain" type="button" onClick={() => setConfirmId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="header-row">
          <h2>Invite codes</h2>
          <button
            className="btn btn-plain"
            type="button"
            disabled={busy !== null || !user}
            onClick={() => user && void run('code', () => createInviteCode(user.uid).then(() => undefined))}
          >
            {busy === 'code' ? 'Creating…' : 'New code'}
          </button>
        </div>
        <h2>Unused</h2>
        <ul className="quiet-list">
          {unused.length === 0 ? <li>No unused codes</li> : null}
          {unused.map((code) => (
            <li key={code.code}>
              <span>{code.code}</span>
              <span className="status">Unused</span>
            </li>
          ))}
        </ul>
        <h2 style={{ marginTop: 18 }}>Used</h2>
        <ul className="quiet-list">
          {used.length === 0 ? <li>No used codes</li> : null}
          {used.map((code) => (
            <li key={code.code}>
              <span>{code.code}</span>
              <span className="status">{code.usedEmail || code.usedBy}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
