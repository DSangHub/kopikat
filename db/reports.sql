-- Run in the Supabase SQL editor. The app also creates this table the first time someone submits a report.
CREATE TABLE IF NOT EXISTS profile_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_slug text NOT NULL,
  reason text NOT NULL,
  details text NOT NULL DEFAULT '',
  reporter_email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profile_reports_created_idx ON profile_reports (created_at DESC);

-- Review new reports:
-- SELECT created_at, profile_slug, reason, details, reporter_email FROM profile_reports ORDER BY created_at DESC;
