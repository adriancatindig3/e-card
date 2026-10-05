import type { Timestamp } from 'firebase/firestore';
import type { LinkMap } from './lib/platforms';

export type UserStatus = 'pending' | 'approved' | 'paused';
export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  status: UserStatus;
  role: UserRole;
  slug: string;
  headline: string;
  company: string;
  location: string;
  bio: string;
  phone: string;
  contactEmail: string;
  profilePhoto: string;
  coverPhoto: string;
  links: LinkMap;
  templateId: string;
  redeemedCode?: string;
}

export interface InviteCodeRecord {
  code: string;
  createdAt: Timestamp | null;
  createdBy: string;
  used: boolean;
  usedBy?: string;
  usedAt?: Timestamp | null;
  usedEmail?: string;
}
