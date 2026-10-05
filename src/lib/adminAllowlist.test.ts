import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseAdminEmails } from './admin';

function quoted(block: string): string[] {
  return [...block.matchAll(/'([^']*)'/g)].map((match) => match[1]).filter(Boolean);
}

describe('admin allowlist', () => {
  it('fails closed when the env list is empty', () => {
    expect(parseAdminEmails('')).toEqual([]);
    expect(parseAdminEmails(undefined)).toEqual([]);
    expect(parseAdminEmails('  ,  ')).toEqual([]);
  });

  it('parses a comma-separated list', () => {
    expect(parseAdminEmails(' Ada@Example.com , other@example.com ')).toEqual([
      'ada@example.com',
      'other@example.com',
    ]);
  });

  it('keeps rules, env, and the admin constant on the same list', () => {
    const root = resolve(process.cwd());
    const rules = readFileSync(resolve(root, 'firestore.rules'), 'utf8');
    const source = readFileSync(resolve(root, 'scripts/admin-emails.mjs'), 'utf8');
    const example = readFileSync(resolve(root, '.env.example'), 'utf8');

    const rulesBlock = rules.match(/function adminEmails\(\) \{[\s\S]*?return \[([\s\S]*?)\];/);
    const sourceBlock = source.match(/export const ADMIN_EMAILS = \[([\s\S]*?)\];/);
    expect(rulesBlock).not.toBeNull();
    expect(sourceBlock).not.toBeNull();

    const fromRules = quoted(rulesBlock?.[1] ?? '');
    const fromSource = quoted(sourceBlock?.[1] ?? '');
    const envLine = example.match(/^VITE_ADMIN_EMAILS=(.*)$/m)?.[1] ?? '';
    const fromEnv = parseAdminEmails(envLine);

    expect(fromRules).toEqual(fromSource);
    expect(fromEnv).toEqual(fromSource);
    expect(rules).toContain('adminEmails().size() > 0');
  });
});
