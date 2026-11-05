import "server-only";
import postgres from "postgres";

const sql = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL, { prepare: false, max: 1, ssl: "require" }) : null;

const createTable = `
CREATE TABLE IF NOT EXISTS profile_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_slug text NOT NULL,
  reason text NOT NULL,
  details text NOT NULL DEFAULT '',
  reporter_email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
)`;

export async function createProfileReport(input: { profileSlug: string; reason: string; details: string; reporterEmail: string }) {
  if (!sql) throw new Error("configuration");
  await sql.unsafe(createTable);
  await sql`INSERT INTO profile_reports (profile_slug, reason, details, reporter_email) VALUES (${input.profileSlug}, ${input.reason}, ${input.details}, ${input.reporterEmail})`;
}
