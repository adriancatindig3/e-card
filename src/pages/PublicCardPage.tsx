import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CardView } from '../components/card/templates';
import { db } from '../lib/firebase';
import { parseProfile, toCardModel } from '../lib/users';
import type { UserProfile } from '../types';

export function PublicCardPage() {
  const { slug = '' } = useParams();
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setProfile(undefined);
    const cards = query(
      collection(db, 'users'),
      where('slug', '==', slug),
      where('status', '==', 'approved'),
      limit(1),
    );
    getDocs(cards)
      .then((snap) => {
        if (cancelled) return;
        const first = snap.docs[0];
        setProfile(first ? parseProfile(first.id, first.data()) : null);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (profile?.displayName) document.title = profile.displayName;
    return () => {
      document.title = 'Digital Card';
    };
  }, [profile]);

  if (profile === undefined) {
    return (
      <div className="center-screen">
        <p className="muted">Loading</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <main className="screen">
        <h1>This card isn’t available</h1>
        <p className="lede">The link may be private, paused, or mistyped.</p>
      </main>
    );
  }

  return <CardView card={toCardModel(profile)} templateId={profile.templateId} mode="screen" />;
}
