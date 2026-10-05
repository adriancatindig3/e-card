import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CardView, TEMPLATES } from '../components/card/templates';
import { useAuth } from '../context/AuthContext';
import { saveTemplate, toCardModel } from '../lib/users';

export function TemplatesPage() {
  const { profile } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;
  if (!profile.updatedAt) {
    return (
      <main className="screen themes">
        <h1>Themes</h1>
        <p className="lede">Save your card first. Themes preview the details you saved.</p>
        <Link className="btn btn-dark" to="/app/edit" style={{ marginTop: 24, maxWidth: 280 }}>
          Edit profile
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
    <main className="screen themes">
      <header className="themes-head">
        <h1>Themes</h1>
        <p className="lede">Click Select on any layout to apply it.</p>
      </header>
      {error ? <p className="field-error">{error}</p> : null}
      <div className="layout-grid">
        {[...TEMPLATES].sort((a, b) => {
          const featured = ['card-02', 'card-03', 'card-10'];
          const ai = featured.indexOf(a.id);
          const bi = featured.indexOf(b.id);
          if (ai === -1 && bi === -1) return 0;
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        }).map((template) => {
          const current = profile.templateId === template.id;
          return (
            <section className="layout-card" key={template.id}>
              <div className="layout-preview">
                <CardView card={card} templateId={template.id} mode="preview" />
              </div>
              <button
                className={`btn btn-dark ${current ? 'is-current' : ''}`}
                type="button"
                disabled={busy !== null || current}
                onClick={() => void choose(template.id)}
              >
                {busy === template.id ? 'Saving…' : current ? 'Selected' : `Select ${template.name}`}
              </button>
            </section>
          );
        })}
      </div>
    </main>
  );
}
