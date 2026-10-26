import {cookies} from "next/headers";

const ACCESS_COOKIE="kopycat_access_token";
const REFRESH_COOKIE="kopycat_refresh_token";
const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function signInWithPassword(email:string,password:string){
  if(!url||!key)return null;
  const response=await fetch(`${url}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:key,"content-type":"application/json"},body:JSON.stringify({email,password}),cache:"no-store"});
  if(!response.ok)return null;
  return response.json() as Promise<{access_token:string;refresh_token:string;expires_in:number}>;
}

export async function setAuthSession(session:{access_token:string;refresh_token:string;expires_in:number}){
  const jar=await cookies();const secure=process.env.NODE_ENV==="production";
  jar.set(ACCESS_COOKIE,session.access_token,{httpOnly:true,sameSite:"lax",secure,path:"/",maxAge:session.expires_in});
  jar.set(REFRESH_COOKIE,session.refresh_token,{httpOnly:true,sameSite:"lax",secure,path:"/",maxAge:60*60*24*30});
}

export async function isAuthenticated(){
  if(!url||!key)return false;const token=(await cookies()).get(ACCESS_COOKIE)?.value;if(!token)return false;
  const response=await fetch(`${url}/auth/v1/user`,{headers:{apikey:key,Authorization:`Bearer ${token}`},cache:"no-store"});
  return response.ok;
}
