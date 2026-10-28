import {NextResponse} from "next/server";
import {exchangeOAuthCode,setAuthSession} from "@/lib/auth";

export async function GET(request:Request){
  const requestUrl=new URL(request.url);
  const code=requestUrl.searchParams.get("code");
  if(code){
    const session=await exchangeOAuthCode(code);
    if(session){
      await setAuthSession(session);
      return NextResponse.redirect(new URL("/dashboard",requestUrl.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=oauth",requestUrl.origin));
}
