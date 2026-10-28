import {redirect} from "next/navigation";
import {getOAuthUrl,setAuthSession,signInWithPassword,type OAuthProvider} from "@/lib/auth";
import {getLocale} from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";
import PasswordField from "@/components/PasswordField";
import LoginSubmitButton from "@/components/LoginSubmitButton";

const providers:OAuthProvider[]=["google","apple","facebook"];

export default async function Login({searchParams}:{searchParams:Promise<{error?:string}>}){
  const [locale,query]=await Promise.all([getLocale(),searchParams]);
  const es=locale==="es";
  async function login(formData:FormData){
    "use server";
    const email=String(formData.get("email")||"").trim();
    const password=String(formData.get("password")||"");
    const session=await signInWithPassword(email,password);
    if(session){await setAuthSession(session);redirect("/dashboard");}
    redirect("/login?error=1");
  }
  async function oauth(formData:FormData){
    "use server";
    const provider=String(formData.get("provider")||"") as OAuthProvider;
    if(!providers.includes(provider))redirect("/login?error=oauth");
    const destination=await getOAuthUrl(provider);
    if(!destination)redirect("/login?error=configuration");
    redirect(destination);
  }
  const errorMessage=query.error==="configuration"?(es?"El inicio de sesión social necesita configuración.":"Social sign-in needs configuration."):query.error?(es?"No se pudo iniciar sesión. Inténtalo de nuevo.":"Sign-in failed. Try again."):null;
  return <main className="authPage"><a className="brand" href="/"><span>K</span>KopyCat</a><div className="authLanguage"><LanguageToggle locale={locale}/></div><div className="authCard"><small>{es?"PORTAL PROFESIONAL":"PROFESSIONAL PORTAL"}</small><h1>{es?"Bienvenido de nuevo.":"Welcome back."}</h1><p>{es?"Administra tus KopyPaks y las conexiones que crean.":"Manage your KopyPaks and the connections they create."}</p>{errorMessage&&<p className="authError" role="alert">{errorMessage}</p>}<form action={oauth} className="authSocialForm"><span>{es?"Continúa con":"Continue with"}</span><div className="socialButtons"><button className="socialButton" name="provider" value="google"><b>G</b>Google</button><button className="socialButton" name="provider" value="apple"><b>●</b>Apple</button><button className="socialButton" name="provider" value="facebook"><b>f</b>Facebook</button></div></form><div className="authDivider"><span>{es?"o usa tu correo":"or use your email"}</span></div><form action={login} className="authPasswordForm"><label>{es?"Correo electrónico":"Email"}<input name="email" type="email" autoComplete="email" required/></label><PasswordField label={es?"Contraseña":"Password"}/><a className="authLink" href="/forgot-password">{es?"¿Olvidaste tu contraseña?":"Forgot password?"}</a><LoginSubmitButton idle={es?"Iniciar sesión":"Sign in"} pendingLabel={es?"Iniciando sesión…":"Signing in…"}/></form><a className="authLink authSignupLink" href="/signup">{es?"¿No tienes cuenta? Crea una":"New to KopyCat? Create an account"}</a></div></main>;
}
