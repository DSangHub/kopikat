import {redirect} from "next/navigation";
import {setAuthSession,signUpWithPassword} from "@/lib/auth";
import {getLocale} from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";

export default async function Signup({searchParams}:{searchParams:Promise<{error?:string;sent?:string}>}){
  const [locale,query]=await Promise.all([getLocale(),searchParams]);
  const es=locale==="es";
  async function signup(formData:FormData){
    "use server";
    const email=String(formData.get("email")||"").trim();
    const password=String(formData.get("password")||"");
    const confirm=String(formData.get("confirm")||"");
    if(password.length<8||password!==confirm)redirect("/signup?error=1");
    const result=await signUpWithPassword(email,password);
    if(!result.ok)redirect("/signup?error=1");
    if(result.session){await setAuthSession(result.session);redirect("/dashboard");}
    redirect("/signup?sent=1");
  }
  return <main className="authPage"><a className="brand" href="/"><span>K</span>KopyCat</a><div className="authLanguage"><LanguageToggle locale={locale}/></div>{query.sent?<div className="authCard"><small>{es?"CUENTA CREADA":"ACCOUNT CREATED"}</small><h1>{es?"Revisa tu correo.":"Check your email."}</h1><p>{es?"Confirma tu dirección de correo para activar tu cuenta KopyCat.":"Confirm your email address to activate your KopyCat account."}</p><a className="primary" href="/login">{es?"Ir a iniciar sesión":"Go to sign in"} →</a></div>:<form action={signup} className="authCard"><small>{es?"CREA TU CUENTA":"CREATE YOUR ACCOUNT"}</small><h1>{es?"Empieza con KopyCat.":"Get started with KopyCat."}</h1><p>{es?"Crea tus KopyPaks y comparte tu perfil con un toque.":"Build your KopyPaks and share your professional profile with one tap."}</p>{query.error&&<p className="authError" role="alert">{es?"Revisa tus datos. Usa una contraseña de al menos 8 caracteres.":"Check your details. Use a password with at least 8 characters."}</p>}<label>{es?"Correo electrónico":"Email"}<input name="email" type="email" autoComplete="email" required/></label><label>{es?"Contraseña":"Password"}<input name="password" type="password" autoComplete="new-password" minLength={8} required/></label><label>{es?"Confirmar contraseña":"Confirm password"}<input name="confirm" type="password" autoComplete="new-password" minLength={8} required/></label><button className="primary">{es?"Crear cuenta":"Create account"} →</button><a className="authLink" href="/login">{es?"¿Ya tienes una cuenta? Inicia sesión":"Already have an account? Sign in"}</a></form>}</main>;
}
