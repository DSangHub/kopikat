# KopyCat

KopyCat is a professional handoff app. A QR scan or NFC tap opens a shareable profile containing contact details, reusable KopyPaks, documents, links and a lead form. The recipient does not need an account or app.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET` to `.env.local` before using the professional portal. Open `/p/maya-homes` to preview the sample public profile.

## Connect Neon

1. Create a Neon PostgreSQL database.
2. Run `db/schema.sql` in the Neon SQL Editor.
3. Add the Neon connection string as `DATABASE_URL` in `.env.local` and Vercel.
4. Add secure values for `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET`.

When `DATABASE_URL` is present, profile reads, lead submissions, and secure password recovery use PostgreSQL automatically.

## Deploy

Push the folder to GitHub, import the repository in Vercel, add the environment variables, and deploy. Program NFC cards with a public URL such as `https://kopycat.app/p/maya-homes`; the NFC tag does not store private documents.

## Included backend

- PostgreSQL schema for profiles, KopyPaks, documents and leads
- Validated `POST /api/leads` endpoint
- Signed, HTTP-only admin session
- Protected `/dashboard`
- Database-aware repository with secure administrator authentication

## Production follow-up

Before public launch, replace the single-admin login with Clerk or Auth.js, add Vercel Blob direct uploads, add per-account ownership checks, and generate real QR image files for print.
