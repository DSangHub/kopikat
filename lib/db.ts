import { neon } from "@neondatabase/serverless";
import { demoProfile } from "./demo";
import type { Lead, Profile } from "./types";

const dbUrl = process.env.DATABASE_URL;
const sql = dbUrl ? neon(dbUrl) : null;
export const hasDatabase = Boolean(sql);

export async function getProfile(slug: string): Promise<Profile | null> {
  if (!sql) return slug === demoProfile.slug ? demoProfile : null;
  const profiles = await sql`SELECT * FROM profiles WHERE slug=${slug} LIMIT 1`;
  if (!profiles[0]) return null;
  const packs = await sql`SELECT * FROM packs WHERE profile_id=${profiles[0].id} ORDER BY created_at`;
  const docs = packs.length ? await sql`SELECT * FROM documents WHERE pack_id = ANY(${packs.map(p => p.id)}) ORDER BY created_at` : [];
  const p = profiles[0];
  return { id: p.id, slug:p.slug, name:p.name, title:p.title, company:p.company, phone:p.phone, email:p.email, bio:p.bio, location:p.location, initials:p.initials,
    packs: packs.map(pack => ({ id:pack.id, slug:pack.slug, title:pack.title, description:pack.description, accent:pack.accent, documents:docs.filter(d=>d.pack_id===pack.id).map(d=>({id:d.id,title:d.title,kind:d.kind,url:d.url})) })) };
}

export async function createLead(input: Omit<Lead,"id"|"createdAt">) {
  if (!sql) return { id: crypto.randomUUID(), ...input, createdAt: new Date().toISOString(), demo: true };
  const rows = await sql`INSERT INTO leads (profile_slug,name,email,phone,message) VALUES (${input.profileSlug},${input.name},${input.email},${input.phone},${input.message}) RETURNING id,created_at`;
  return { id:rows[0].id, ...input, createdAt:rows[0].created_at };
}

export async function listLeads(): Promise<Lead[]> {
  if (!sql) return [];
  const rows = await sql`SELECT id,profile_slug,name,email,phone,message,created_at FROM leads ORDER BY created_at DESC LIMIT 100`;
  return rows.map(r=>({id:r.id,profileSlug:r.profile_slug,name:r.name,email:r.email,phone:r.phone,message:r.message,createdAt:r.created_at}));
}
