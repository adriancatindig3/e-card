import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { isAllowlistedAdmin } from './admin';
import type { CardModel } from './card';
import { db } from './firebase';
import { generateInviteCode } from './invites';
import { PLATFORM_IDS, type LinkMap, type PlatformId } from './platforms';
import { validateProfile, type ProfileInput } from './profile';
import { randomSlugSuffix, slugify } from './slug';
import type { InviteCodeRecord, UserProfile, UserRole, UserStatus } from '../types';

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asLinks(value: unknown): LinkMap {
  if (!value || typeof value !== 'object') return {};
  const links: LinkMap = {};
  for (const id of PLATFORM_IDS) {
    const entry = (value as Record<string, unknown>)[id];
    if (typeof entry === 'string' && entry.trim()) links[id] = entry;
  }
  return links;
}

export function parseProfile(id: string, data: DocumentData): UserProfile {
  const status: UserStatus =
    data.status === 'approved' || data.status === 'paused' || data.status === 'pending'
      ? data.status
      : 'pending';
  const role: UserRole = data.role === 'admin' ? 'admin' : 'user';
  return {
    uid: id,
    email: asString(data.email),
    displayName: asString(data.displayName),
    photoURL: asString(data.photoURL),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    status,
    role,
    slug: asString(data.slug),
    headline: asString(data.headline),
    company: asString(data.company),
    location: asString(data.location),
    bio: asString(data.bio),
    phone: asString(data.phone),
    contactEmail: asString(data.contactEmail),
    profilePhoto: asString(data.profilePhoto),
    coverPhoto: asString(data.coverPhoto),
    links: asLinks(data.links),
    templateId: /^card-(0[1-9]|1[0-9]|20)$/.test(asString(data.templateId))
      ? asString(data.templateId)
      : 'card-01',
    redeemedCode: typeof data.redeemedCode === 'string' ? data.redeemedCode : undefined,
  };
}

export function toCardModel(profile: UserProfile): CardModel {
  return {
    displayName: profile.displayName,
    headline: profile.headline,
    company: profile.company,
    location: profile.location,
    bio: profile.bio,
    phone: profile.phone,
    contactEmail: profile.contactEmail,
    profilePhoto: profile.profilePhoto || profile.photoURL,
    coverPhoto: profile.coverPhoto,
    links: profile.links,
  };
}

function photoUrl(value: string | null): string {
  if (!value || !value.startsWith('https://') || value.length > 2000) return '';
  return value;
}

export async function ensureProfile(user: User): Promise<void> {
  const email = user.email;
  if (!email) throw new Error('Your Google account did not share an email address.');
  const admin = isAllowlistedAdmin(email);
  const base = slugify(user.displayName || email.split('@')[0] || 'card');
  const displayName = (user.displayName || 'Member').slice(0, 80);
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const suffix = randomSlugSuffix();
    const candidate =
      attempt === 0 ? base : `${base.slice(0, Math.max(2, 40 - suffix.length - 1))}-${suffix}`;
    try {
      const outcome = await runTransaction(db, async (tx) => {
        const userRef = doc(db, 'users', user.uid);
        const slugRef = doc(db, 'slugs', candidate);
        const userSnap = await tx.get(userRef);
        if (userSnap.exists()) return 'exists' as const;
        const slugSnap = await tx.get(slugRef);
        if (slugSnap.exists()) return 'taken' as const;
        tx.set(userRef, {
          email,
          displayName,
          photoURL: photoUrl(user.photoURL),
          createdAt: serverTimestamp(),
          status: admin ? 'approved' : 'pending',
          role: admin ? 'admin' : 'user',
          slug: candidate,
          headline: '',
          company: '',
          location: '',
          bio: '',
          phone: '',
          contactEmail: '',
          profilePhoto: '',
          coverPhoto: '',
          links: {},
          templateId: 'card-01',
        });
        tx.set(slugRef, { uid: user.uid });
        return 'ok' as const;
      });
      if (outcome === 'taken') continue;
      return;
    } catch (error) {
      lastError = error;
      break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Could not reserve a public link.');
}

export class ProfileValidationError extends Error {
  fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>) {
    super('Check the highlighted fields.');
    this.fieldErrors = fieldErrors;
  }
}

export async function saveProfile(uid: string, input: ProfileInput): Promise<void> {
  const { errors, links } = validateProfile(input);
  if (Object.keys(errors).length > 0) throw new ProfileValidationError(errors);
  await updateDoc(doc(db, 'users', uid), {
    displayName: input.displayName.trim(),
    headline: input.headline.trim(),
    company: input.company.trim(),
    location: input.location.trim(),
    bio: input.bio.trim(),
    phone: input.phone.trim(),
    contactEmail: input.contactEmail.trim(),
    profilePhoto: input.profilePhoto.trim(),
    coverPhoto: input.coverPhoto.trim(),
    links,
    updatedAt: serverTimestamp(),
  });
}

export async function changeSlug(uid: string, previous: string, next: string): Promise<void> {
  if (next === previous) return;
  await runTransaction(db, async (tx) => {
    const userRef = doc(db, 'users', uid);
    const nextRef = doc(db, 'slugs', next);
    const prevRef = doc(db, 'slugs', previous);
    const userSnap = await tx.get(userRef);
    const nextSnap = await tx.get(nextRef);
    const prevSnap = previous ? await tx.get(prevRef) : null;
    if (!userSnap.exists()) throw new Error('Profile missing.');
    if (nextSnap.exists() && nextSnap.data().uid !== uid) {
      throw new Error('That link is already taken.');
    }
    if (prevSnap?.exists()) tx.delete(prevRef);
    if (!nextSnap.exists()) tx.set(nextRef, { uid });
    tx.update(userRef, { slug: next, updatedAt: serverTimestamp() });
  });
}

export async function saveTemplate(uid: string, templateId: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    templateId,
    updatedAt: serverTimestamp(),
  });
}

export async function setUserStatus(uid: string, status: UserStatus): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { status });
}

export async function deleteUserProfile(uid: string, slug: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const slugRef = doc(db, 'slugs', slug || '_');
    const slugSnap = slug ? await tx.get(slugRef) : null;
    tx.delete(doc(db, 'users', uid));
    if (slugSnap?.exists()) tx.delete(slugRef);
  });
}

export async function createInviteCode(adminUid: string): Promise<string> {
  const code = generateInviteCode();
  await runTransaction(db, async (tx) => {
    const ref = doc(db, 'inviteCodes', code);
    const snap = await tx.get(ref);
    if (snap.exists()) throw new Error('Could not create a code. Try again.');
    tx.set(ref, {
      code,
      createdAt: serverTimestamp(),
      createdBy: adminUid,
      used: false,
    });
  });
  return code;
}

export async function redeemInvite(uid: string, email: string, code: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const userRef = doc(db, 'users', uid);
    const codeRef = doc(db, 'inviteCodes', code);
    const userSnap = await tx.get(userRef);
    const codeSnap = await tx.get(codeRef);
    if (!userSnap.exists()) throw new Error('Your profile is missing.');
    if (userSnap.data().status !== 'pending') {
      throw new Error('This account is not waiting for approval.');
    }
    if (!codeSnap.exists()) throw new Error('That invite code is not valid.');
    if (codeSnap.data().used === true) throw new Error('That invite code has already been used.');
    tx.update(userRef, { status: 'approved', redeemedCode: code });
    tx.update(codeRef, {
      used: true,
      usedBy: uid,
      usedEmail: email,
      usedAt: serverTimestamp(),
    });
  });
}

export function watchUsers(onData: (users: UserProfile[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'users'),
    (snap) => onData(snap.docs.map((item) => parseProfile(item.id, item.data()))),
    (error) => onError(error),
  );
}

export function watchInviteCodes(
  onData: (codes: InviteCodeRecord[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'inviteCodes'),
    (snap) =>
      onData(
        snap.docs.map((item) => {
          const data = item.data();
          return {
            code: asString(data.code) || item.id,
            createdAt: data.createdAt ?? null,
            createdBy: asString(data.createdBy),
            used: data.used === true,
            usedBy: typeof data.usedBy === 'string' ? data.usedBy : undefined,
            usedAt: data.usedAt ?? null,
            usedEmail: typeof data.usedEmail === 'string' ? data.usedEmail : undefined,
          };
        }),
      ),
    (error) => onError(error),
  );
}

export function emptyLinkForm(links: LinkMap): Record<PlatformId, string> {
  return PLATFORM_IDS.reduce(
    (form, id) => {
      form[id] = links[id] ?? '';
      return form;
    },
    {} as Record<PlatformId, string>,
  );
}
