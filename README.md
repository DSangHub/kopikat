# KopyCat

KopyCat is a professional handoff app. A QR scan or NFC tap opens a shareable profile containing contact details, reusable KopyPaks, documents, links and a lead form. The recipient does not need an account or app.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Connect Supabase

1. Run `db/schema.sql`, then `db/kopypak-files.sql` in the SQL Editor.
2. Add `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and PostgreSQL `DATABASE_URL` to `.env.local` and Vercel.
3. Set `NEXT_PUBLIC_APP_URL` to the deployed KopyCat URL.
4. In Supabase Authentication, set the Site URL and allow `/reset-password` and `/auth/callback` as redirect URLs.
5. Create an account and save your profile from the dashboard.

Portal sign-in and password recovery use Supabase Auth with HTTP-only cookies. OAuth providers must be configured in Supabase before use.

## KopyPaks

Open `/dashboard/kopypaks` after saving your profile. Create and rename packs, edit descriptions, add document links, upload PDF/JPG/PNG files up to 750 KB, and remove documents. Each account can have 20 packs and 100 documents. Use an external HTTP(S) link for larger files.

Files are stored in Postgres with RLS enabled and Data API access revoked. Server actions validate the Supabase user and enforce profile ownership on every write. Files and links are public on the saved profile; the UI warns users before they save. Downloads use attachment and nosniff headers. Removing a document also removes its stored bytes.

Each nonempty pack can generate a Phone Tap/QR handoff from its sharing panel. The transfer endpoint checks account ownership. No extra storage API key or email subscription is needed for KopyPak creation.

## Deploy

Push to GitHub and import the repository in Vercel. Add the environment variables and run both schema scripts before deployment. Program NFC cards with the public profile URL shown in your dashboard or the generated handoff link.
