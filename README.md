# KopyCat

KopyCat is a professional handoff app. A QR scan or NFC tap opens a shareable profile containing contact details, reusable KopyPaks, documents, links and a lead form. The recipient does not need an account or app.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add the Supabase values from `.env.example` to `.env.local` before using the professional portal.

## Connect Supabase

1. Create a Supabase project and run `db/schema.sql` in the SQL Editor.
2. Add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `.env.local` and Vercel.
3. Set `NEXT_PUBLIC_APP_URL` to the deployed KopyCat URL.
4. In Supabase Authentication, set the Site URL to the deployed URL and allow `/reset-password` as a redirect URL.
5. Invite or create the first portal user in Supabase Authentication.

Portal sign-in and password recovery use Supabase Auth. Add a PostgreSQL `DATABASE_URL` when you are ready to persist profiles, KopyPaks, documents, leads, and phone transfers.

## Deploy

Push the folder to GitHub, import the repository in Vercel, add the environment variables, and deploy. Program NFC cards with a public URL such as `https://kopycat.app/p/maya-homes`; the NFC tag does not store private documents.

## Included backend

- PostgreSQL schema for profiles, KopyPaks, documents and leads
- Validated `POST /api/leads` endpoint
- Supabase Auth with HTTP-only session cookies
- Protected `/dashboard`
- Bilingual password recovery flow

## Production follow-up

Before public launch, add Vercel Blob direct uploads, add per-account ownership policies, and generate print-ready QR image files.
