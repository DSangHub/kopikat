import postgres from "postgres";
import { demoProfile } from "./demo";
import type { Lead, Profile, TransferPreview } from "./types";

const dbUrl = process.env.DATABASE_URL;
const sql = dbUrl ? postgres(dbUrl, {prepare:false,max:1,ssl:"require"}) : null;
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

async function tokenHash(token:string){const data=new TextEncoder().encode(token);const digest=await crypto.subtle.digest("SHA-256",data);return Buffer.from(digest).toString("hex");}
async function demoSignature(payload:string){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(process.env.SESSION_SECRET||"local-kopycat-secret"),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return Buffer.from(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload))).toString("base64url");}
async function createDemoToken(profileSlug:string,packSlug:string,recipientEmail:string,expiresAt:string){const payload=Buffer.from(JSON.stringify({profileSlug,packSlug,recipientEmail,expiresAt})).toString("base64url");return `${payload}.${await demoSignature(payload)}`;}
async function readDemoToken(token:string){try{const [payload,signature]=token.split(".");if(!payload||!signature||signature!==await demoSignature(payload))return null;return JSON.parse(Buffer.from(payload,"base64url").toString()) as {profileSlug:string;packSlug:string;recipientEmail:string;expiresAt:string;status?:"pending"};}catch{return null;}}

export async function createTransfer(profileSlug:string,packSlug:string,recipientEmail:string){
  const expiresAt=new Date(Date.now()+24*60*60*1000).toISOString();
  if(!sql)return {token:await createDemoToken(profileSlug,packSlug,recipientEmail,expiresAt),expiresAt,demo:true};
  const token=Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString("base64url");
  const hash=await tokenHash(token);
  await sql`INSERT INTO transfers (token_hash,profile_slug,pack_slug,recipient_email,expires_at) VALUES (${hash},${profileSlug},${packSlug},${recipientEmail},${expiresAt})`;
  return {token,expiresAt};
}

export async function getTransfer(token:string):Promise<TransferPreview|null>{
  let record:{profileSlug:string;packSlug:string;recipientEmail:string;expiresAt:string;status:"pending"|"accepted"|"revoked"}|null=null;
  if(!sql){const decoded=await readDemoToken(token);if(decoded)record={...decoded,status:"pending"};}
  else{const rows=await sql`SELECT profile_slug,pack_slug,recipient_email,status,expires_at FROM transfers WHERE token_hash=${await tokenHash(token)} LIMIT 1`;if(rows[0])record={profileSlug:rows[0].profile_slug,packSlug:rows[0].pack_slug,recipientEmail:rows[0].recipient_email,status:rows[0].status,expiresAt:new Date(rows[0].expires_at).toISOString()};}
  if(!record)return null;
  const profile=await getProfile(record.profileSlug);const pack=profile?.packs.find(p=>p.slug===record!.packSlug);if(!profile||!pack)return null;
  const status=new Date(record.expiresAt)<new Date()?"expired":record.status;
  return {token,senderName:profile.name,senderCompany:profile.company,profileSlug:profile.slug,pack,expiresAt:record.expiresAt,status};
}

export async function acceptTransfer(token:string,recipientEmail:string){
  const preview=await getTransfer(token);if(!preview||preview.status!=="pending")return null;
  if(!sql)return {...preview,status:"accepted" as const,recipientEmail,demo:true};
  const rows=await sql`UPDATE transfers SET status='accepted',recipient_email=${recipientEmail},accepted_at=now() WHERE token_hash=${await tokenHash(token)} AND status='pending' AND expires_at>now() RETURNING id`;
  return rows[0]?{...preview,status:"accepted" as const,recipientEmail}:null;
}


export async function getAccountProfile(userId:string):Promise<Profile|null>{
  if(!sql)return null;
  const rows=await sql`SELECT slug FROM profiles WHERE id=${userId} LIMIT 1`;
  return rows[0]?getProfile(rows[0].slug):null;
}

export async function saveAccountProfile(userId:string,input:{name:string;title:string;company:string;phone:string;email:string;bio:string;location:string}){
  if(!sql)throw new Error("Database unavailable");
  const slug="user-"+userId;
  const initials=input.name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join("").toUpperCase();
  await sql`INSERT INTO profiles (id,slug,name,title,company,phone,email,bio,location,initials)
    VALUES (${userId},${slug},${input.name},${input.title},${input.company},${input.phone},${input.email},${input.bio},${input.location},${initials})
    ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,title=EXCLUDED.title,company=EXCLUDED.company,phone=EXCLUDED.phone,email=EXCLUDED.email,bio=EXCLUDED.bio,location=EXCLUDED.location,initials=EXCLUDED.initials`;
}

export async function listAccountLeads(userId:string):Promise<Lead[]>{
  if(!sql)return [];
  const rows=await sql`SELECT l.* FROM leads l JOIN profiles p ON p.slug=l.profile_slug WHERE p.id=${userId} ORDER BY l.created_at DESC LIMIT 100`;
  return rows.map(r=>({id:r.id,profileSlug:r.profile_slug,name:r.name,email:r.email,phone:r.phone,message:r.message,createdAt:r.created_at}));
}
