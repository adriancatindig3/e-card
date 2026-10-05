export function Cover({ src, className = '' }: { src: string; className?: string }) {
  if (!src) return <div className={`cover is-empty ${className}`} />;
  return <img className={`cover ${className}`} src={src} alt="" />;
}

export function Avatar({ src, name, className = '' }: { src: string; name: string; className?: string }) {
  if (src) return <img className={`avatar ${className}`} src={src} alt="" />;
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '•';
  return <span className={`avatar is-fallback ${className}`}>{initials}</span>;
}

export function TextBits({ card }: { card: { headline: string; company: string; location: string; bio: string } }) {
  return (
    <>
      {card.headline ? <p className="headline">{card.headline}</p> : null}
      {card.company ? <p className="company">{card.company}</p> : null}
      {card.location ? <p className="location">{card.location}</p> : null}
      {card.bio ? <p className="bio">{card.bio}</p> : null}
    </>
  );
}
