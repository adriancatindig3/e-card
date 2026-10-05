# Digital Card

A mobile-first public card. People sign in with Google, an admin approves them (or they redeem a one-time invite code), and they publish a page at `/c/:slug` with a QR code and one of 20 layouts.

Images upload directly to Cloudinary. Only the returned `https` `secure_url` is stored in Firestore. The app does not use Firebase Storage, and it does not use a Cloudinary API secret.

The `backend/` directory is an earlier PHP uploader. This app does not call it.

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

Other commands:

```bash
npm test
npm run build
```

Open the dev server and sign in with **Continue with Google**.

## Environment

Public client config lives in `.env.example` (committed) and `.env.local` (gitignored).

| Variable | Purpose |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Firebase web apiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase authDomain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase projectId (`e-card-72671`) |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storageBucket (unused for images) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messagingSenderId |
| `VITE_FIREBASE_APP_ID` | Firebase appId |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics, started only when the browser supports it |
| `VITE_CLOUDINARY_CLOUD_NAME` | `df3fvlapt` |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Unsigned preset `digital-card` |
| `VITE_ADMIN_EMAILS` | Comma-separated admin emails. Empty by default. |

## Admin email (one place)

Admin emails start empty, so the admin UI and Firestore rules fail closed. Nobody is an admin until you add one.

1. Edit `scripts/admin-emails.mjs` (`ADMIN_EMAILS`).
2. Run `npm run sync-admin-rules`.

That writes the same list into `VITE_ADMIN_EMAILS` (`.env.example` and `.env.local`) and into `adminEmails()` in `firestore.rules`. Restart the dev server and deploy the rules again.

## Firebase console (project e-card-72671)

1. **Authentication → Sign-in method → Google → Enable.**
2. **Create a Firestore database** if it does not exist.
3. **Firestore → Rules:** paste `firestore.rules` (or deploy it). The Rules tab in the console is enough.
4. Add the admin Gmail in `scripts/admin-emails.mjs`, run `npm run sync-admin-rules`, and deploy the updated rules. Put the same address in `VITE_ADMIN_EMAILS` before rebuilding.
5. If Google sign-in rejects localhost, add `localhost` under **Authentication → Settings → Authorized domains**. It is usually there already.

## What the app stores

- `users/{uid}` — email, display name, Google photo URL, `createdAt`, `status` (`pending`, `approved`, `paused`), `role` (`user` or `admin`), unique `slug`, card fields, `links`, and `templateId` (`card-01` … `card-20`).
- `slugs/{slug}` — `{ uid }` so a public link cannot be claimed twice.
- `inviteCodes/{code}` — one-time codes. Redeeming a valid unused code sets that user to `approved` and marks the code used by their uid, in one transaction.

Pending, paused, and missing slugs do not render a public card. Only `status == approved` is readable in a public query.

Deleting someone removes their Firestore profile (and slug). The client SDK cannot delete the Firebase Authentication user, so this app does not pretend to. If they sign in again, a new pending profile is created and the old public card stays gone.

Paused accounts see a paused screen with sign out, and their public URL stays hidden.
