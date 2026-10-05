import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isAllowlistedAdmin } from '../lib/admin';
import { setupMessage } from '../lib/errors';
import { auth, db } from '../lib/firebase';
import { ensureProfile, parseProfile } from '../lib/users';
import type { UserProfile } from '../types';

interface AuthValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setupError: string | null;
  retrySetup: () => void;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setSetupError(null);
      if (!next) setProfile(null);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    setProfile(undefined);
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => setProfile(snap.exists() ? parseProfile(snap.id, snap.data()) : null),
      (error) => setSetupError(setupMessage(error, isAllowlistedAdmin(user.email))),
    );
  }, [user]);

  useEffect(() => {
    if (!user || profile !== null || setupError) return;
    let cancelled = false;
    ensureProfile(user).catch((error: unknown) => {
      if (!cancelled) setSetupError(setupMessage(error, isAllowlistedAdmin(user.email)));
    });
    return () => {
      cancelled = true;
    };
  }, [user, profile, setupError, attempt]);

  const value = useMemo<AuthValue>(
    () => ({
      user: user ?? null,
      profile: profile ?? null,
      loading: user === undefined || (!!user && profile === undefined && !setupError),
      setupError,
      retrySetup: () => {
        setSetupError(null);
        setAttempt((current) => current + 1);
      },
      signOutUser: () => signOut(auth),
    }),
    [user, profile, setupError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
