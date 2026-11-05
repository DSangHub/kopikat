import "server-only";
import postgres from "postgres";

const sql = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL, { prepare: false, max: 1, ssl: "require" }) : null;
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function deletePublicData(userId: string) {
  if (!sql) throw new Error("configuration");
  await sql.begin(async (tx) => {
    await tx`DELETE FROM leads WHERE profile_slug IN (SELECT slug FROM profiles WHERE id=${userId})`;
    await tx`DELETE FROM transfers WHERE profile_slug IN (SELECT slug FROM profiles WHERE id=${userId})`;
    await tx`DELETE FROM profiles WHERE id=${userId}`;
  });
}

async function deleteAuthUser(userId: string) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return false;
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: "no-store",
  });
  if (response.ok || response.status === 404) return true;
  console.error("Supabase account deletion failed", { status: response.status });
  return false;
}

export async function deleteAccount(userId: string) {
  if (!sql || !uuid.test(userId)) throw new Error("configuration");
  try {
    await sql.begin(async (tx) => {
      await tx`DELETE FROM leads WHERE profile_slug IN (SELECT slug FROM profiles WHERE id=${userId})`;
      await tx`DELETE FROM transfers WHERE profile_slug IN (SELECT slug FROM profiles WHERE id=${userId})`;
      await tx`DELETE FROM profiles WHERE id=${userId}`;
      await tx`DELETE FROM auth.users WHERE id=${userId}`;
    });
    return;
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "unknown";
    console.error("Database account deletion needs the auth admin path", { code });
  }
  if (!(await deleteAuthUser(userId))) throw new Error("configuration");
  await deletePublicData(userId);
}
