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
    if(password.length<8||password!==confirm)redirect("/signup?error=details");
    const result=await signUpWithPassword(email,password);
    if(!result.ok)redirect(`/signup?error=${result.error}`);
    if(result.session){await setAuthSession(result.session);redirect("/dashboard");}
    redirect("/signup?sent=1");
  }
  const messages:Record<string,string>=es?{details:"Revisa tus datos. Las contraseñas deben coincidir y tener al menos 8 caracteres.",rate_limit:"Se enviaron demasiados correos. Espera una hora e inténtalo de nuevo.",disabled:"La creación de cuentas está desactivada temporalmente.",weak_password:"Elige una contraseña más segura.",email_exists:"Esta dirección de correo ya tiene una cuenta. Inicia sesión.",configuration:"El servicio de cuentas necesita configuración.",unknown:"No se pudo crear la cuenta. Inténtalo de nuevo."}:{details:"Check your details. Passwords must match and contain at least 8 characters.",rate_limit:"Too many emails were sent. Wait one hour and try again.",disabled:"Account creation is temporarily disabled.",weak_password:"Choose a stronger password.",email_exists:"This email already has an account. Sign in instead.",configuration:"The account service needs configuration.",unknown:"The account could not be created. Try again."};
  const errorMessage=query.error?messages[query.error]||messages.unknown:null;
  return <main className="authPage"><a className="brand" href="/"><span>K</span>KopyCat</a><div className="authLanguage"><LanguageToggle locale={locale}/></div>{query.sent?<div className="authCard"><small>{es?"CUENTA CREADA":"ACCOUNT CREATED"}</small><h1>{es?"Revisa tu correo.":"Check your email."}</h1><p>{es?"Confirma tu dirección de correo para activar tu cuenta KopyCat.":"Confirm your email address to activate your KopyCat account."}</p><a className="primary" href="/login">{es?"Ir a iniciar sesión":"Go to sign in"} →</a></div>:<form action={signup} className="authCard"><small>{es?"CREA TU CUENTA":"CREATE YOUR ACCOUNT"}</small><h1>{es?"Empieza con KopyCat.":"Get started with KopyCat."}</h1><p>{es?"Crea tus KopyPaks y comparte tu perfil con un toque.":"Build your KopyPaks and share your professional profile with one tap."}</p>{errorMessage&&<p className="authError" role="alert">{errorMessage}</p>}<label>{es?"Correo electrónico":"Email"}<input name="email" type="email" autoComplete="email" required/></label><label>{es?"Contraseña":"Password"}<input name="password" type="password" autoComplete="new-password" minLength={8} required/></label><label>{es?"Confirmar contraseña":"Confirm password"}<input name="confirm" type="password" autoComplete="new-password" minLength={8} required/></label><button className="primary">{es?"Crear cuenta":"Create account"} →</button><a className="authLink" href="/login">{es?"¿Ya tienes una cuenta? Inicia sesión":"Already have an account? Sign in"}</a></form>}</main>;
}
