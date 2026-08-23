import { cookies } from "next/headers";
const COOKIE = "kopikat_session";
const enc = new TextEncoder();
async function signature(value:string){ const key=await crypto.subtle.importKey("raw",enc.encode(process.env.SESSION_SECRET||"local-kopikat-secret"),{name:"HMAC",hash:"SHA-256"},false,["sign"]); const sig=await crypto.subtle.sign("HMAC",key,enc.encode(value)); return Buffer.from(sig).toString("base64url"); }
export async function makeSession(email:string){ const payload=Buffer.from(JSON.stringify({email,exp:Date.now()+86400000})).toString("base64url"); return `${payload}.${await signature(payload)}`; }
export async function isAuthenticated(){ const value=(await cookies()).get(COOKIE)?.value; if(!value)return false; const [payload,sig]=value.split("."); if(!payload||!sig||sig!==await signature(payload))return false; try{return JSON.parse(Buffer.from(payload,"base64url").toString()).exp>Date.now();}catch{return false;} }
export const sessionCookie={name:COOKIE,options:{httpOnly:true,sameSite:"lax" as const,secure:process.env.NODE_ENV==="production",path:"/",maxAge:86400}};
