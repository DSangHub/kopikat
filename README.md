# KopiKat

KopiKat is a professional handoff app. A QR scan or NFC tap opens a shareable profile containing contact details, reusable KopiPaks, documents, links and a lead form. The recipient does not need an account or app.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The project runs without a database using the built-in Maya Rodriguez demo. Open `/p/maya-homes`. The demo dashboard credentials are `demo@kopikat.app` / `kopikat-demo`.

## Connect Neon

1. Create a Neon PostgreSQL database.
2. Run `db/schema.sql` in the Neon SQL Editor.
3. Add the Neon connection string as `DATABASE_URL` in `.env.local` and Vercel.
4. Add secure values for `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET`.

When `DATABASE_URL` is present, profile reads and lead submissions use PostgreSQL automatically. Without it, the public design and API remain testable in demo mode.

## Deploy

Push the folder to GitHub, import the repository in Vercel, add the environment variables, and deploy. Program NFC cards with a public URL such as `https://kopikat.app/p/maya-homes`; the NFC tag does not store private documents.

## Included backend

- PostgreSQL schema for profiles, KopiPaks, documents and leads
- Validated `POST /api/leads` endpoint
- Signed, HTTP-only admin session
- Protected `/dashboard`
- Database-aware repository with local demo fallback

## Production follow-up

Before public launch, replace the single-admin login with Clerk or Auth.js, add Vercel Blob direct uploads, add per-account ownership checks, and generate real QR image files for print.
