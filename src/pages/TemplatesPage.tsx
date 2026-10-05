import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CardView, TEMPLATES } from '../components/card/templates';
import { useAuth } from '../context/AuthContext';
import { saveTemplate, toCardModel } from '../lib/users';

export function TemplatesPage() {
  const { profile, signOutUser } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;
  if (!profile.updatedAt) {
    return (
      <main className="screen">
        <h1>Layout</h1>
        <p className="lede">Save your card first. Layouts preview the details you saved.</p>
        <Link className="btn btn-primary" to="/app/edit" style={{ marginTop: 24 }}>
          Edit card
        </Link>
      </main>
    );
  }

  const card = toCardModel(profile);

  async function choose(templateId: string) {
    if (!profile) return;
    setError(null);
    setBusy(templateId);
    try {
      await saveTemplate(profile.uid, templateId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this layout.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="screen">
      <div className="header-row">
        <Link className="btn btn-plain" to="/app">Back</Link>
        <button className="btn btn-plain" type="button" onClick={() => void signOutUser()}>Sign out</button>
      </div>
      <h1 style={{ marginTop: 12 }}>Layout</h1>
      <p className="lede">Every preview uses the card you saved.</p>
      {error ? <p className="field-error">{error}</p> : null}
      {TEMPLATES.map((template) => {
        const current = profile.templateId === template.id;
        return (
          <section className="layout-choice" key={template.id}>
            <div className="choice-head">
              <h2>{template.name}</h2>
              {current ? (
                <span className="pill">Current</span>
              ) : (
                <button className="btn btn-plain" type="button" disabled={busy !== null} onClick={() => void choose(template.id)}>
                  {busy === template.id ? 'Saving…' : 'Use this layout'}
                </button>
              )}
            </div>
            <CardView card={card} templateId={template.id} mode="preview" />
          </section>
        );
      })}
    </main>
  );
}
