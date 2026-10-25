CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS profiles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text UNIQUE NOT NULL, name text NOT NULL, title text NOT NULL DEFAULT '', company text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '', bio text NOT NULL DEFAULT '', location text NOT NULL DEFAULT '', initials text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS packs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, slug text NOT NULL, title text NOT NULL, description text NOT NULL DEFAULT '', accent text NOT NULL DEFAULT 'coral', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(profile_id,slug));
CREATE TABLE IF NOT EXISTS documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), pack_id uuid NOT NULL REFERENCES packs(id) ON DELETE CASCADE, title text NOT NULL, kind text NOT NULL DEFAULT 'LINK', url text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS leads (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_slug text NOT NULL, name text NOT NULL, email text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', message text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS leads_profile_created_idx ON leads(profile_slug,created_at DESC);

CREATE TABLE IF NOT EXISTS transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text UNIQUE NOT NULL,
  profile_slug text NOT NULL,
  pack_slug text NOT NULL,
  recipient_email text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transfers_profile_created_idx ON transfers(profile_slug,created_at DESC);
CREATE INDEX IF NOT EXISTS transfers_recipient_idx ON transfers(lower(recipient_email),created_at DESC);
