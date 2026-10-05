import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlatformIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { uploadImage } from '../lib/cloudinary';
import { PLATFORMS, detectPlatformLink, type PlatformId } from '../lib/platforms';
import { emptyLinks, type ProfileInput } from '../lib/profile';
import { ProfileValidationError, emptyLinkForm, saveProfile } from '../lib/users';

export function EditorPage() {
  const { profile } = useAuth();
  const [form, setForm] = useState<ProfileInput | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<'profilePhoto' | 'coverPhoto' | null>(null);
  const [draftLink, setDraftLink] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkNotice, setLinkNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      displayName: profile.displayName,
      headline: profile.headline,
      company: profile.company,
      location: profile.location,
      bio: profile.bio,
      phone: profile.phone,
      contactEmail: profile.contactEmail,
      profilePhoto: profile.profilePhoto,
      coverPhoto: profile.coverPhoto,
      links: { ...emptyLinks(), ...emptyLinkForm(profile.links) },
    });
  }, [profile]);

  function setField<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function onFile(kind: 'profilePhoto' | 'coverPhoto', file: File | undefined) {
    if (!file) return;
    setErrors((current) => ({ ...current, [kind]: '' }));
    setUploading(kind);
    try {
      const url = await uploadImage(file);
      setField(kind, url);
    } catch (err) {
      setErrors((current) => ({
        ...current,
        [kind]: err instanceof Error ? err.message : 'Upload failed.',
      }));
    } finally {
      setUploading(null);
    }
  }

  function addDetectedLink() {
    const detected = detectPlatformLink(draftLink);
    if (!detected.ok) {
      setLinkError(detected.error);
      setLinkNotice(null);
      return;
    }
    const label = PLATFORMS.find((item) => item.id === detected.platform)?.label ?? 'Link';
    const replaced = Boolean(form?.links[detected.platform]?.trim());
    setForm((current) =>
      current
        ? { ...current, links: { ...current.links, [detected.platform]: detected.href } }
        : current,
    );
    setDraftLink('');
    setLinkError(null);
    setLinkNotice(replaced ? `${label} updated.` : `${label} added.`);
    setErrors((current) => ({ ...current, [`links.${detected.platform}`]: '' }));
  }

  function removeLink(platform: PlatformId) {
    setForm((current) =>
      current ? { ...current, links: { ...current.links, [platform]: '' } } : current,
    );
    setLinkNotice(null);
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || !form) return;
    setBusy(true);
    setNotice(null);
    try {
      await saveProfile(profile.uid, form);
      setErrors({});
      setNotice('Saved. You can choose a layout.');
    } catch (err) {
      if (err instanceof ProfileValidationError) setErrors(err.fieldErrors);
      else setNotice(null);
      if (!(err instanceof ProfileValidationError)) {
        setErrors({ form: err instanceof Error ? err.message : 'Save failed.' });
      }
    } finally {
      setBusy(false);
    }
  }

  if (!form) return <div className="center-screen"><p className="muted">Loading</p></div>;

  const added = PLATFORMS.filter((platform) => Boolean(form.links[platform.id]?.trim()));
  const identity = [form.headline, form.company].filter(Boolean).join(' · ');

  return (
    <main className="screen editor">
      <h1>Edit profile</h1>
      <form onSubmit={onSave}>
        <section className="edit-hero">
          <div className="edit-cover">
            {form.coverPhoto ? <img src={form.coverPhoto} alt="" /> : <div className="edit-cover-empty" />}
            <label className="change-cover">
              {uploading === 'coverPhoto' ? 'Uploading…' : 'Change cover'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading !== null}
                onChange={(event) => void onFile('coverPhoto', event.target.files?.[0])}
              />
            </label>
          </div>
          <div className="edit-person">
            <div className="edit-avatar-wrap">
              {form.profilePhoto ? (
                <img className="edit-avatar" src={form.profilePhoto} alt="" />
              ) : (
                <div className="edit-avatar empty" />
              )}
              <label className="edit-avatar-btn" aria-label={uploading === 'profilePhoto' ? 'Uploading profile photo' : 'Change profile photo'}>
                <span aria-hidden="true">+</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploading !== null}
                  onChange={(event) => void onFile('profilePhoto', event.target.files?.[0])}
                />
              </label>
            </div>
            <div>
              <strong>{form.displayName.trim() || 'Your name'}</strong>
              <span>{identity || 'Headline and company'}</span>
            </div>
          </div>
          <div className="edit-photo-actions">
            {form.coverPhoto ? (
              <button className="btn btn-plain" type="button" onClick={() => setField('coverPhoto', '')}>
                Remove cover
              </button>
            ) : null}
            {form.profilePhoto ? (
              <button className="btn btn-plain" type="button" onClick={() => setField('profilePhoto', '')}>
                Remove photo
              </button>
            ) : null}
          </div>
          {errors.coverPhoto ? <p className="field-error">{errors.coverPhoto}</p> : null}
          {errors.profilePhoto ? <p className="field-error">{errors.profilePhoto}</p> : null}
        </section>

        <section className="panel">
          <h2>Basic information</h2>
          <Field label="Name" value={form.displayName} error={errors.displayName} onChange={(value) => setField('displayName', value)} />
          <Field label="Headline" value={form.headline} error={errors.headline} onChange={(value) => setField('headline', value)} />
          <Field label="Company" value={form.company} error={errors.company} onChange={(value) => setField('company', value)} />
          <Field label="Location" value={form.location} error={errors.location} onChange={(value) => setField('location', value)} />
          <Field label="Bio" value={form.bio} error={errors.bio} multiline onChange={(value) => setField('bio', value)} />
          <p className="char-count">{form.bio.length}/600</p>
        </section>

        <section className="panel">
          <h2>Contact</h2>
          <Field label="Phone" value={form.phone} error={errors.phone} onChange={(value) => setField('phone', value)} />
          <Field label="Email" value={form.contactEmail} error={errors.contactEmail} onChange={(value) => setField('contactEmail', value)} />
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Social links</h2>
            <button className="btn btn-plain add-link" type="button" onClick={addDetectedLink}>
              + Add link
            </button>
          </div>
          {added.length > 0 ? (
            <ul className="added-links">
              {added.map((platform) => (
                <li key={platform.id}>
                  <PlatformIcon id={platform.id} />
                  <div>
                    <strong>{platform.label}</strong>
                    <span>{form.links[platform.id]}</span>
                  </div>
                  <button className="btn btn-plain" type="button" onClick={() => removeLink(platform.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="note">No links yet. Paste one below and we’ll detect the account.</p>
          )}
          <label className="field">
            <span className="sr-only">Link</span>
            <input
              value={draftLink}
              placeholder="https://..."
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) => {
                setDraftLink(event.target.value);
                setLinkError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addDetectedLink();
                }
              }}
            />
          </label>
          {linkError ? <p className="field-error">{linkError}</p> : null}
          {linkNotice ? <p className="note">{linkNotice}</p> : null}
          {PLATFORMS.map((platform) =>
            errors[`links.${platform.id}`] ? (
              <p className="field-error" key={platform.id}>
                {platform.label}: {errors[`links.${platform.id}`]}
              </p>
            ) : null,
          )}
        </section>

        {errors.form ? <p className="field-error">{errors.form}</p> : null}
        {notice ? (
          <p className="note">
            {notice} <Link to="/app/templates">Choose a theme</Link>
          </p>
        ) : null}
        <div className="save-row">
          <Link className="btn btn-quiet" to="/app">
            Cancel
          </Link>
          <button className="btn btn-dark" type="submit" disabled={busy || uploading !== null}>
            {busy ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={error ? true : undefined} />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
        />
      )}
      {error ? <p className="field-error">{error}</p> : null}
    </label>
  );
}

