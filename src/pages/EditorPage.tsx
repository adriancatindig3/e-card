import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadImage } from '../lib/cloudinary';
import { PLATFORMS } from '../lib/platforms';
import { emptyLinks, type ProfileInput } from '../lib/profile';
import { ProfileValidationError, emptyLinkForm, saveProfile } from '../lib/users';

export function EditorPage() {
  const { profile, signOutUser } = useAuth();
  const [form, setForm] = useState<ProfileInput | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<'profilePhoto' | 'coverPhoto' | null>(null);

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

  return (
    <main className="screen">
      <div className="header-row">
        <Link className="btn btn-plain" to="/app">Back</Link>
        <button className="btn btn-plain" type="button" onClick={() => void signOutUser()}>Sign out</button>
      </div>
      <h1 style={{ marginTop: 12 }}>Edit</h1>
      <form onSubmit={onSave}>
        <section className="section">
          <h2>Profile</h2>
          <div className="group">
            <Field label="Name" value={form.displayName} error={errors.displayName} onChange={(value) => setField('displayName', value)} />
            <Field label="Headline" value={form.headline} error={errors.headline} onChange={(value) => setField('headline', value)} />
            <Field label="Company" value={form.company} error={errors.company} onChange={(value) => setField('company', value)} />
            <Field label="Location" value={form.location} error={errors.location} onChange={(value) => setField('location', value)} />
            <Field label="Bio" value={form.bio} error={errors.bio} multiline onChange={(value) => setField('bio', value)} />
          </div>
        </section>
        <section className="section">
          <h2>Contact</h2>
          <div className="group">
            <Field label="Phone" value={form.phone} error={errors.phone} onChange={(value) => setField('phone', value)} />
            <Field label="Email" value={form.contactEmail} error={errors.contactEmail} onChange={(value) => setField('contactEmail', value)} />
          </div>
        </section>
        <section className="section">
          <h2>Photos</h2>
          <div className="photo-row">
            <PhotoField
              label="Profile photo"
              src={form.profilePhoto}
              round
              uploading={uploading === 'profilePhoto'}
              error={errors.profilePhoto}
              onFile={(file) => void onFile('profilePhoto', file)}
              onClear={() => setField('profilePhoto', '')}
            />
            <PhotoField
              label="Cover photo"
              src={form.coverPhoto}
              uploading={uploading === 'coverPhoto'}
              error={errors.coverPhoto}
              onFile={(file) => void onFile('coverPhoto', file)}
              onClear={() => setField('coverPhoto', '')}
            />
          </div>
        </section>
        <section className="section">
          <h2>Links</h2>
          <div className="group">
            {PLATFORMS.map((platform) => (
              <Field
                key={platform.id}
                label={platform.label}
                placeholder={platform.placeholder}
                value={form.links[platform.id] ?? ''}
                error={errors[`links.${platform.id}`]}
                onChange={(value) =>
                  setForm((current) =>
                    current
                      ? { ...current, links: { ...current.links, [platform.id]: value } as ProfileInput['links'] }
                      : current,
                  )
                }
              />
            ))}
          </div>
        </section>
        {errors.form ? <p className="field-error">{errors.form}</p> : null}
        {notice ? (
          <p className="note">
            {notice} <Link to="/app/templates">Choose layout</Link>
          </p>
        ) : null}
        <div className="sticky-save">
          <button className="btn btn-primary" type="submit" disabled={busy || uploading !== null}>
            {busy ? 'Saving…' : 'Save'}
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

function PhotoField({
  label,
  src,
  round,
  uploading,
  error,
  onFile,
  onClear,
}: {
  label: string;
  src: string;
  round?: boolean;
  uploading: boolean;
  error?: string;
  onFile: (file: File | undefined) => void;
  onClear: () => void;
}) {
  return (
    <div className="field">
      <span>{label}</span>
      {src ? (
        <img className={round ? 'photo-preview avatar-preview' : 'photo-preview'} src={src} alt="" />
      ) : (
        <div className={round ? 'photo-empty avatar-preview' : 'photo-empty'} />
      )}
      <div className="btn-row">
        <label className="btn btn-quiet file-btn">
          {uploading ? 'Uploading…' : src ? 'Replace' : 'Add'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={(event) => onFile(event.target.files?.[0])}
          />
        </label>
        {src ? (
          <button className="btn btn-plain" type="button" onClick={onClear}>
            Remove
          </button>
        ) : null}
      </div>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
