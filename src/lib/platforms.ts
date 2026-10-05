export const PLATFORM_IDS = [
  'facebook',
  'instagram',
  'x',
  'linkedin',
  'tiktok',
  'youtube',
  'whatsapp',
  'telegram',
  'github',
  'snapchat',
  'pinterest',
  'discord',
  'threads',
  'website',
] as const;

export type PlatformId = (typeof PLATFORM_IDS)[number];

export const PLATFORMS: { id: PlatformId; label: string; placeholder: string }[] = [
  { id: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/you' },
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/you' },
  { id: 'x', label: 'X', placeholder: 'https://x.com/you' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/you' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@you' },
  { id: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@you' },
  { id: 'whatsapp', label: 'WhatsApp', placeholder: '+1 555 123 4567' },
  { id: 'telegram', label: 'Telegram', placeholder: 'https://t.me/you' },
  { id: 'github', label: 'GitHub', placeholder: 'https://github.com/you' },
  { id: 'snapchat', label: 'Snapchat', placeholder: 'https://snapchat.com/add/you' },
  { id: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/you' },
  { id: 'discord', label: 'Discord', placeholder: 'https://discord.gg/invite' },
  { id: 'threads', label: 'Threads', placeholder: 'https://threads.net/@you' },
  { id: 'website', label: 'Website', placeholder: 'https://example.com' },
];

export const PLATFORM_HOSTS: Record<Exclude<PlatformId, 'website' | 'whatsapp'>, readonly string[]> = {
  facebook: ['facebook.com', 'fb.com'],
  instagram: ['instagram.com'],
  x: ['x.com', 'twitter.com'],
  linkedin: ['linkedin.com'],
  tiktok: ['tiktok.com'],
  youtube: ['youtube.com', 'youtu.be'],
  telegram: ['t.me', 'telegram.me', 'telegram.org'],
  github: ['github.com'],
  snapchat: ['snapchat.com'],
  pinterest: ['pinterest.com', 'pin.it'],
  discord: ['discord.com', 'discord.gg'],
  threads: ['threads.net'],
};

export type LinkMap = Partial<Record<PlatformId, string>>;

export type FieldResult =
  | { ok: true; empty: true }
  | { ok: true; empty: false; href: string }
  | { ok: false; error: string };

export function hostnameAllowed(hostname: string, roots: readonly string[]): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return roots.some((root) => host === root || host.endsWith(`.${root}`));
}

function formatHosts(hosts: readonly string[]): string {
  if (hosts.length <= 1) return hosts[0] ?? '';
  if (hosts.length === 2) return `${hosts[0]} or ${hosts[1]}`;
  return `${hosts.slice(0, -1).join(', ')}, or ${hosts[hosts.length - 1]}`;
}

export function parseHttpUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:/i.test(trimmed)) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (!url.hostname || url.hostname === 'localhost' || !url.hostname.includes('.')) return null;
  if (url.username || url.password) return null;
  return url;
}

function validateWhatsApp(trimmed: string): FieldResult {
  const compact = trimmed.replace(/[\s()-]/g, '');
  if (/^\+?[0-9]{8,15}$/.test(compact)) {
    return { ok: true, empty: false, href: `https://wa.me/${compact.replace(/^\+/, '')}` };
  }
  const url = parseHttpUrl(trimmed);
  if (!url || !hostnameAllowed(url.hostname, ['wa.me', 'whatsapp.com'])) {
    return {
      ok: false,
      error: 'WhatsApp only accepts a phone number or a wa.me / whatsapp.com link.',
    };
  }
  return { ok: true, empty: false, href: url.toString() };
}

function validateWebsite(trimmed: string): FieldResult {
  const url = parseHttpUrl(trimmed);
  if (!url) return { ok: false, error: 'Enter a valid website URL.' };
  return { ok: true, empty: false, href: url.toString() };
}

const DETECT_ORDER = PLATFORM_IDS.filter((id) => id !== 'website');

/** Recognize a pasted URL or WhatsApp number and return the matching platform. */
export function detectPlatformLink(raw: string):
  | { ok: true; platform: PlatformId; href: string }
  | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: 'Paste a link first.' };
  for (const platform of DETECT_ORDER) {
    const result = validatePlatformLink(platform, trimmed);
    if (result.ok && !result.empty) return { ok: true, platform, href: result.href };
  }
  const website = validatePlatformLink('website', trimmed);
  if (website.ok && !website.empty) return { ok: true, platform: 'website', href: website.href };
  return { ok: false, error: 'Paste a full link, like https://instagram.com/you or a WhatsApp number.' };
}

export function validatePlatformLink(platform: PlatformId, raw: string): FieldResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, empty: true };
  if (platform === 'whatsapp') return validateWhatsApp(trimmed);
  if (platform === 'website') return validateWebsite(trimmed);
  const hosts = PLATFORM_HOSTS[platform];
  const url = parseHttpUrl(trimmed);
  if (!url || !hostnameAllowed(url.hostname, hosts)) {
    const label = PLATFORMS.find((item) => item.id === platform)?.label ?? platform;
    return { ok: false, error: `${label} only accepts ${formatHosts(hosts)} links.` };
  }
  return { ok: true, empty: false, href: url.toString() };
}

export function validatePhone(raw: string):
  | { ok: true; empty: true }
  | { ok: true; empty: false; tel: string }
  | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, empty: true };
  const compact = trimmed.replace(/[\s().-]/g, '');
  if (!/^\+?[0-9]{7,15}$/.test(compact)) {
    return { ok: false, error: 'Enter a phone number with at least 7 digits.' };
  }
  return { ok: true, empty: false, tel: `tel:${compact}` };
}

export function validateEmail(raw: string):
  | { ok: true; empty: true }
  | { ok: true; empty: false; href: string }
  | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, empty: true };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }
  return { ok: true, empty: false, href: `mailto:${trimmed}` };
}

export function isHttpsUrl(value: string): boolean {
  return value === '' || /^https:\/\/\S+$/.test(value);
}
