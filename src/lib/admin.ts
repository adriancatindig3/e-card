/** Comma-separated admin emails from VITE_ADMIN_EMAILS. Empty means nobody is an admin. */
export function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function adminEmails(): string[] {
  return parseAdminEmails(import.meta.env.VITE_ADMIN_EMAILS);
}

export function isAllowlistedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = adminEmails();
  if (list.length === 0) return false;
  return list.includes(email.trim().toLowerCase());
}
