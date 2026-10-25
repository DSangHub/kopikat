import { neon } from "@neondatabase/serverless";
import { demoProfile } from "./demo";
import type { Lead, Profile, TransferPreview } from "./types";

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

const demoTokens = new Map<string,{profileSlug:string;packSlug:string;recipientEmail:string;expiresAt:string;status:"pending"|"accepted"|"revoked"}>();
async function tokenHash(token:string){const data=new TextEncoder().encode(token);const digest=await crypto.subtle.digest("SHA-256",data);return Buffer.from(digest).toString("hex");}

export async function createTransfer(profileSlug:string,packSlug:string,recipientEmail:string){
  const token=Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString("base64url");
  const expiresAt=new Date(Date.now()+24*60*60*1000).toISOString();
  if(!sql){demoTokens.set(token,{profileSlug,packSlug,recipientEmail,expiresAt,status:"pending"});return {token,expiresAt,demo:true};}
  const hash=await tokenHash(token);
  await sql`INSERT INTO transfers (token_hash,profile_slug,pack_slug,recipient_email,expires_at) VALUES (${hash},${profileSlug},${packSlug},${recipientEmail},${expiresAt})`;
  return {token,expiresAt};
}

export async function getTransfer(token:string):Promise<TransferPreview|null>{
  let record:{profileSlug:string;packSlug:string;recipientEmail:string;expiresAt:string;status:"pending"|"accepted"|"revoked"}|null=null;
  if(!sql)record=demoTokens.get(token)||null;
  else{const rows=await sql`SELECT profile_slug,pack_slug,recipient_email,status,expires_at FROM transfers WHERE token_hash=${await tokenHash(token)} LIMIT 1`;if(rows[0])record={profileSlug:rows[0].profile_slug,packSlug:rows[0].pack_slug,recipientEmail:rows[0].recipient_email,status:rows[0].status,expiresAt:new Date(rows[0].expires_at).toISOString()};}
  if(!record)return null;
  const profile=await getProfile(record.profileSlug);const pack=profile?.packs.find(p=>p.slug===record!.packSlug);if(!profile||!pack)return null;
  const status=new Date(record.expiresAt)<new Date()?"expired":record.status;
  return {token,senderName:profile.name,senderCompany:profile.company,profileSlug:profile.slug,pack,expiresAt:record.expiresAt,status};
}

export async function acceptTransfer(token:string,recipientEmail:string){
  const preview=await getTransfer(token);if(!preview||preview.status!=="pending")return null;
  if(!sql){const row=demoTokens.get(token);if(row){row.status="accepted";row.recipientEmail=recipientEmail;}return {...preview,status:"accepted" as const,recipientEmail,demo:true};}
  const rows=await sql`UPDATE transfers SET status='accepted',recipient_email=${recipientEmail},accepted_at=now() WHERE token_hash=${await tokenHash(token)} AND status='pending' AND expires_at>now() RETURNING id`;
  return rows[0]?{...preview,status:"accepted" as const,recipientEmail}:null;
}
