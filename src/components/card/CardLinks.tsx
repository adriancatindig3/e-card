import { externalLinkProps, linkItems, type CardModel } from '../../lib/card';
import { Chevron, PlatformIcon } from '../Icons';

export function CardLinks({
  card,
  variant,
  omit = [],
}: {
  card: CardModel;
  variant: 'rows' | 'icons' | 'sheet';
  omit?: string[];
}) {
  const items = linkItems(card).filter((item) => !omit.includes(item.id));
  if (items.length === 0) return null;

  if (variant === 'icons') {
    return (
      <div className="link-icons">
        {items.map((item) => (
          <a key={item.id} className="card-link icon-btn" href={item.href} aria-label={item.aria} {...externalLinkProps(item.href)}>
            <PlatformIcon id={item.id} />
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className={`link-list ${variant}`}>
      {items.map((item) => (
        <a key={item.id} className="card-link row" href={item.href} aria-label={item.aria} {...externalLinkProps(item.href)}>
          <PlatformIcon id={item.id} />
          <span>{item.label}</span>
          {variant === 'sheet' ? <Chevron /> : null}
        </a>
      ))}
    </div>
  );
}
