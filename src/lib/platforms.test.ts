import { describe, expect, it } from 'vitest';
import { normalizeInviteCode } from './invites';
import {
  PLATFORM_HOSTS,
  hostnameAllowed,
  validateEmail,
  validatePhone,
  validatePlatformLink,
  type PlatformId,
} from './platforms';
import { slugify } from './slug';

describe('platform hosts', () => {
  for (const [platform, hosts] of Object.entries(PLATFORM_HOSTS) as [
    Exclude<PlatformId, 'website' | 'whatsapp'>,
    readonly string[],
  ][]) {
    it(`accepts ${platform} on ${hosts[0]}`, () => {
      const result = validatePlatformLink(platform, `https://${hosts[0]}/me`);
      expect(result.ok).toBe(true);
      if (result.ok && !result.empty) expect(result.href).toContain(hosts[0]);
    });

    it(`rejects a mismatched host for ${platform}`, () => {
      const result = validatePlatformLink(platform, 'https://example.com/me');
      expect(result.ok).toBe(false);
    });
  }
});

describe('validatePlatformLink', () => {
  it('treats an empty field as empty', () => {
    expect(validatePlatformLink('facebook', '   ')).toEqual({ ok: true, empty: true });
  });

  it('accepts facebook.com, www, m, and fb.com', () => {
    for (const value of [
      'https://facebook.com/ada',
      'https://www.facebook.com/ada',
      'https://m.facebook.com/ada',
      'http://fb.com/ada',
      'facebook.com/ada',
    ]) {
      const result = validatePlatformLink('facebook', value);
      expect(result.ok, value).toBe(true);
    }
  });

  it('rejects lookalike and cross-platform hosts', () => {
    for (const value of [
      'https://instagram.com/ada',
      'https://notfacebook.com/ada',
      'https://facebook.com.evil.com/ada',
      'https://evil.com/facebook.com',
      'https://user:pass@facebook.com/ada',
      'javascript:alert(1)',
      'data:text/html,hello',
    ]) {
      expect(validatePlatformLink('facebook', value).ok, value).toBe(false);
    }
  });

  it('rejects a facebook url in the instagram field', () => {
    const result = validatePlatformLink('instagram', 'https://facebook.com/ada');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/instagram\.com/i);
  });

  it('accepts x.com and twitter.com for X', () => {
    expect(validatePlatformLink('x', 'https://x.com/ada').ok).toBe(true);
    expect(validatePlatformLink('x', 'https://mobile.twitter.com/ada').ok).toBe(true);
    expect(validatePlatformLink('x', 'https://instagram.com/ada').ok).toBe(false);
  });

  it('accepts youtube.com and youtu.be', () => {
    expect(validatePlatformLink('youtube', 'https://youtu.be/abc').ok).toBe(true);
    expect(validatePlatformLink('youtube', 'https://music.youtube.com/watch?v=1').ok).toBe(true);
  });

  it('accepts whatsapp numbers and wa.me links', () => {
    const number = validatePlatformLink('whatsapp', '+1 (555) 123-4567');
    expect(number).toEqual({ ok: true, empty: false, href: 'https://wa.me/15551234567' });
    expect(validatePlatformLink('whatsapp', 'https://wa.me/15551234567').ok).toBe(true);
    expect(validatePlatformLink('whatsapp', 'https://api.whatsapp.com/send?phone=15551234567').ok).toBe(true);
    expect(validatePlatformLink('whatsapp', 'https://chat.whatsapp.com/abc').ok).toBe(true);
  });

  it('rejects short numbers and non-whatsapp urls', () => {
    expect(validatePlatformLink('whatsapp', '12345').ok).toBe(false);
    expect(validatePlatformLink('whatsapp', 'https://facebook.com/ada').ok).toBe(false);
    const result = validatePlatformLink('whatsapp', 'https://example.com');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/WhatsApp/);
  });

  it('accepts any http website and rejects other schemes', () => {
    const site = validatePlatformLink('website', 'example.com/hello');
    expect(site.ok).toBe(true);
    if (site.ok && !site.empty) expect(site.href.startsWith('https://example.com/')).toBe(true);
    expect(validatePlatformLink('website', 'ftp://example.com').ok).toBe(false);
    expect(validatePlatformLink('website', 'not a url').ok).toBe(false);
  });

  it('does not treat a suffixed host as the platform', () => {
    expect(hostnameAllowed('evilfacebook.com', ['facebook.com'])).toBe(false);
    expect(hostnameAllowed('www.facebook.com', ['facebook.com'])).toBe(true);
    expect(hostnameAllowed('facebook.com.attacker.com', ['facebook.com'])).toBe(false);
  });
});

describe('phone and email', () => {
  it('builds a tel link', () => {
    expect(validatePhone('+1 555.123.4567')).toEqual({ ok: true, empty: false, tel: 'tel:+15551234567' });
    expect(validatePhone('12').ok).toBe(false);
    expect(validatePhone('')).toEqual({ ok: true, empty: true });
  });

  it('builds a mailto link', () => {
    expect(validateEmail('ada@example.com')).toEqual({
      ok: true,
      empty: false,
      href: 'mailto:ada@example.com',
    });
    expect(validateEmail('ada').ok).toBe(false);
  });
});

describe('slug and invite code shape', () => {
  it('slugifies a name', () => {
    expect(slugify('Ada Lovelace')).toBe('ada-lovelace');
    expect(slugify('A')).toBe('card');
  });

  it('normalizes a one-time invite code', () => {
    expect(normalizeInviteCode('ab01-cd45-ef67')).toBeNull();
    expect(normalizeInviteCode('ABCD EFGH JKLM')).toBe('ABCD-EFGH-JKLM');
  });
});
