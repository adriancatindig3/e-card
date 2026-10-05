/**
 * SINGLE SOURCE OF TRUTH for admin emails.
 *
 * 1. Add lowercase Gmail addresses to ADMIN_EMAILS.
 * 2. Run: npm run sync-admin-rules
 *
 * That rewrites VITE_ADMIN_EMAILS in .env.example and .env.local
 * and the allowlist inside firestore.rules.
 * An empty list fails closed: nobody is an admin.
 * Do not invent an address here.
 */
export const ADMIN_EMAILS = [];
