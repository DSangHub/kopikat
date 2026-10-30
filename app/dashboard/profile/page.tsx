import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {getCurrentUser} from "@/lib/auth";
import {getAccountProfile,saveAccountProfile} from "@/lib/db";
import {getLocale} from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";

export default async function ProfileEditor({searchParams}:{searchParams:Promise<{saved?:string;error?:string}>}){
  const user=await getCurrentUser();
  if(!user)redirect("/login");
  const [profile,locale,query]=await Promise.all([getAccountProfile(user.id),getLocale(),searchParams]);
  const es=locale==="es";
  async function save(formData:FormData){
    "use server";
    const current=await getCurrentUser();
    if(!current)redirect("/login");
    const text=(name:string,max:number)=>String(formData.get(name)||"").trim().slice(0,max);
    const name=text("name",120);
    if(!name)redirect("/dashboard/profile?error=name");
    await saveAccountProfile(current.id,{name,title:text("title",160),company:text("company",160),phone:text("phone",60),email:text("email",254),bio:text("bio",2000),location:text("location",160)});
    const updated=await getAccountProfile(current.id);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    if(updated)revalidatePath("/p/"+updated.slug);
    redirect("/dashboard/profile?saved=1");
  }
  return <main className="authPage"><a className="brand" href="/dashboard"><span>K</span>KopyCat</a><div className="authLanguage"><LanguageToggle locale={locale}/></div><form action={save} className="authCard" style={{marginTop:70,marginBottom:30,width:"min(600px,100%)"}}><small>{es?"TU PERFIL":"YOUR PROFILE"}</small><h1>{es?"Mi perfil":"My profile"}</h1><p>{es?"Guarda tus datos para crear tu página pública de KopyCat. Los campos que completes serán públicos.":"Save your details to create your public KopyCat page. Details you enter here will be public."}</p>{query.saved&&<p role="status">{es?"Perfil guardado.":"Profile saved."}</p>}{query.error&&<p className="authError" role="alert">{es?"Escribe tu nombre.":"Enter your name."}</p>}<label>{es?"Nombre":"Name"}<input name="name" defaultValue={profile?.name||""} maxLength={120} autoComplete="name" required/></label><label>{es?"Cargo o profesión":"Title or profession"}<input name="title" defaultValue={profile?.title||""} maxLength={160}/></label><label>{es?"Empresa":"Company"}<input name="company" defaultValue={profile?.company||""} maxLength={160}/></label><label>{es?"Teléfono público":"Public phone"}<input name="phone" type="tel" defaultValue={profile?.phone||""} maxLength={60}/></label><label>{es?"Correo público (opcional)":"Public email (optional)"}<input name="email" type="email" defaultValue={profile?.email||""} maxLength={254}/></label><label>{es?"Ubicación":"Location"}<input name="location" defaultValue={profile?.location||""} maxLength={160}/></label><label>{es?"Acerca de ti":"About you"}<textarea name="bio" defaultValue={profile?.bio||""} maxLength={2000} rows={4} style={{padding:13,border:"1px solid #ccd5d0",borderRadius:7,font:"inherit"}}/></label><button className="primary" type="submit">{es?"Guardar perfil":"Save profile"} →</button>{profile&&<a className="authLink" href={"/p/"+profile.slug}>{es?"Ver perfil público":"View public profile"} ↗</a>}<a className="authLink" href="/dashboard">{es?"Volver al resumen":"Back to dashboard"}</a></form></main>;
}
