import {createHash,randomBytes} from "node:crypto";
import {cookies,headers} from "next/headers";

const ACCESS_COOKIE="kopycat_access_token";
const REFRESH_COOKIE="kopycat_refresh_token";
const OAUTH_VERIFIER_COOKIE="kopycat_oauth_verifier";
const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;

export type OAuthProvider="google"|"apple"|"facebook";
type AuthSession={access_token:string;refresh_token:string;expires_in:number};
type SignupError="configuration"|"rate_limit"|"email_not_authorized"|"disabled"|"weak_password"|"email_exists"|"unknown";

export async function signInWithPassword(email:string,password:string){
  if(!url||!key)return null;
  const response=await fetch(`${url}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:key,"content-type":"application/json"},body:JSON.stringify({email,password}),cache:"no-store"});
  if(!response.ok)return null;
  return response.json() as Promise<AuthSession>;
}

export async function getOAuthUrl(provider:OAuthProvider){
  if(!url||!key)return null;
  const verifier=randomBytes(32).toString("base64url");
  const challenge=createHash("sha256").update(verifier).digest("base64url");
  const configuredOrigin=process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/,"");
  const requestHeaders=await headers();
  const host=requestHeaders.get("x-forwarded-host")||requestHeaders.get("host");
  const protocol=requestHeaders.get("x-forwarded-proto")||"https";
  const origin=configuredOrigin||(host?`${protocol}://${host}`:null);
  if(!origin)return null;
  const jar=await cookies();
  jar.set(OAUTH_VERIFIER_COOKIE,verifier,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:600});
  const params=new URLSearchParams({provider,redirect_to:`${origin}/auth/callback`,code_challenge:challenge,code_challenge_method:"s256"});
  return `${url}/auth/v1/authorize?${params.toString()}`;
}

export async function exchangeOAuthCode(code:string){
  if(!url||!key)return null;
  const jar=await cookies();
  const verifier=jar.get(OAUTH_VERIFIER_COOKIE)?.value;
  jar.delete(OAUTH_VERIFIER_COOKIE);
  if(!verifier)return null;
  const response=await fetch(`${url}/auth/v1/token?grant_type=pkce`,{method:"POST",headers:{apikey:key,"content-type":"application/json"},body:JSON.stringify({auth_code:code,code_verifier:verifier}),cache:"no-store"});
  if(!response.ok){console.error("Supabase OAuth exchange failed",{status:response.status});return null;}
  return response.json() as Promise<AuthSession>;
}

export async function signUpWithPassword(email:string,password:string){
  if(!url||!key)return {ok:false as const,session:null,error:"configuration" as SignupError};
  const appUrl=process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/,"");
  const endpoint=`${url}/auth/v1/signup${appUrl?`?redirect_to=${encodeURIComponent(`${appUrl}/dashboard`)}`:""}`;
  const response=await fetch(endpoint,{method:"POST",headers:{apikey:key,"content-type":"application/json"},body:JSON.stringify({email,password}),cache:"no-store"});
  const payload=await response.json().catch(()=>({})) as Partial<AuthSession>&{code?:string;error_code?:string;message?:string;msg?:string};
  if(!response.ok){
    const code=String(payload.code||payload.error_code||"").toLowerCase();
    const message=String(payload.message||payload.msg||"").toLowerCase();
    let error:SignupError="unknown";
    if(code.includes("email_address_not_authorized"))error="email_not_authorized";
    else if(response.status===429||code.includes("rate"))error="rate_limit";
    else if(code.includes("signup_disabled")||code.includes("not_allowed"))error="disabled";
    else if(code.includes("weak_password"))error="weak_password";
    else if(code.includes("user_already_exists")||code.includes("email_exists")||message.includes("already registered")||message.includes("already exists"))error="email_exists";
    console.error("Supabase signup failed",{status:response.status,reason:error});
    return {ok:false as const,session:null,error};
  }
  const session=payload.access_token&&payload.refresh_token&&payload.expires_in?{access_token:payload.access_token,refresh_token:payload.refresh_token,expires_in:payload.expires_in}:null;
  return {ok:true as const,session,error:null};
}

export async function setAuthSession(session:AuthSession){
  const jar=await cookies();const secure=process.env.NODE_ENV==="production";
  jar.set(ACCESS_COOKIE,session.access_token,{httpOnly:true,sameSite:"lax",secure,path:"/",maxAge:session.expires_in});
  jar.set(REFRESH_COOKIE,session.refresh_token,{httpOnly:true,sameSite:"lax",secure,path:"/",maxAge:60*60*24*30});
}

export async function isAuthenticated(){
  if(!url||!key)return false;const token=(await cookies()).get(ACCESS_COOKIE)?.value;if(!token)return false;
  const response=await fetch(`${url}/auth/v1/user`,{headers:{apikey:key,Authorization:`Bearer ${token}`},cache:"no-store"});
  return response.ok;
}


export async function getCurrentUser(): Promise<{id:string;email:string}|null>{
  if(!url||!key)return null;
  const token=(await cookies()).get(ACCESS_COOKIE)?.value;
  if(!token)return null;
  const response=await fetch(`${url}/auth/v1/user`,{headers:{apikey:key,Authorization:`Bearer ${token}`},cache:"no-store"});
  if(!response.ok)return null;
  const user=await response.json();
  return typeof user.id==="string" ? {id:user.id,email:user.email||""} : null;
}
