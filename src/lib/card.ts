import {
  PLATFORMS,
  validateEmail,
  validatePhone,
  validatePlatformLink,
  type LinkMap,
} from './platforms';

export interface CardModel {
  displayName: string;
  headline: string;
  company: string;
  location: string;
  bio: string;
  phone: string;
  contactEmail: string;
  profilePhoto: string;
  coverPhoto: string;
  links: LinkMap;
}

export interface LinkItem {
  id: string;
  label: string;
  aria: string;
  href: string;
}

export function linkItems(card: CardModel): LinkItem[] {
  const items: LinkItem[] = [];
  const phone = validatePhone(card.phone);
  if (phone.ok && !phone.empty) {
    items.push({
      id: 'phone',
      label: card.phone.trim(),
      aria: `Call ${card.phone.trim()}`,
      href: phone.tel,
    });
  }
  const email = validateEmail(card.contactEmail);
  if (email.ok && !email.empty) {
    items.push({
      id: 'email',
      label: card.contactEmail.trim(),
      aria: `Email ${card.contactEmail.trim()}`,
      href: email.href,
    });
  }
  for (const platform of PLATFORMS) {
    const raw = card.links[platform.id];
    if (!raw) continue;
    const result = validatePlatformLink(platform.id, raw);
    if (result.ok && !result.empty) {
      items.push({
        id: platform.id,
        label: platform.label,
        aria: platform.label,
        href: result.href,
      });
    }
  }
  return items;
}

export function externalLinkProps(href: string): { target?: string; rel?: string } {
  if (/^https?:/i.test(href)) return { target: '_blank', rel: 'noopener noreferrer' };
  return {};
}
