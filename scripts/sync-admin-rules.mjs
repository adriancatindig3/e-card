import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADMIN_EMAILS } from './admin-emails.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const emails = ADMIN_EMAILS.map((email) => String(email).trim().toLowerCase()).filter(Boolean);
for (const email of emails) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`Invalid admin email: ${email}`);
    process.exit(1);
  }
  if (email.includes("'") || email.includes('\\')) {
    console.error(`Unsupported character in admin email: ${email}`);
    process.exit(1);
  }
}

const literal = emails.map((email) => `'${email}'`).join(', ');
const block = `// ADMIN_ALLOWLIST_START
    function adminEmails() {
      return [${literal}];
    }
    // ADMIN_ALLOWLIST_END`;

const rulesPath = resolve(root, 'firestore.rules');
const rules = readFileSync(rulesPath, 'utf8');
const next = rules.replace(/\/\/ ADMIN_ALLOWLIST_START[\s\S]*?\/\/ ADMIN_ALLOWLIST_END/, block);
if (next === rules || !next.includes('function adminEmails()')) {
  console.error('Could not find the admin allowlist markers in firestore.rules');
  process.exit(1);
}
writeFileSync(rulesPath, next);

const line = `VITE_ADMIN_EMAILS=${emails.join(',')}`;
for (const name of ['.env.example', '.env.local']) {
  const path = resolve(root, name);
  if (!existsSync(path)) continue;
  const text = readFileSync(path, 'utf8');
  const updated = /^VITE_ADMIN_EMAILS=.*$/m.test(text)
    ? text.replace(/^VITE_ADMIN_EMAILS=.*$/m, line)
    : `${text.replace(/\s*$/, '')}\n${line}\n`;
  writeFileSync(path, updated);
}

console.log(emails.length ? `Admin allowlist: ${emails.join(', ')}` : 'Admin allowlist empty (fail closed).');
