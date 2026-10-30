import {redirect} from "next/navigation";
import Link from "next/link";
import {getCurrentUser} from "@/lib/auth";
import {getAccountProfile,listAccountLeads} from "@/lib/db";
import TransferCreator from "@/components/TransferCreator";
import LanguageToggle from "@/components/LanguageToggle";
import {getLocale} from "@/lib/i18n";
import "../transfers.css";

export default async function Dashboard({searchParams}:{searchParams:Promise<{view?:string}>}){
  const user=await getCurrentUser();
  if(!user)redirect("/login");
  const requested=(await searchParams).view;
  if(requested==="kopypaks")redirect("/dashboard/kopypaks");
  const view=["kopypaks","phone-tap","leads"].includes(requested||"")?requested:"overview";
  const [p,leads,locale]=await Promise.all([getAccountProfile(user.id),listAccountLeads(user.id),getLocale()]);
  const pack=p?.packs[0];const es=locale==="es";
  const menu=[{key:"overview",href:"/dashboard",label:es?"Resumen":"Overview"},{key:"profile",href:"/dashboard/profile",label:es?"Mi perfil":"My profile"},{key:"kopypaks",href:"/dashboard/kopypaks",label:"KopyPaks"},{key:"phone-tap",href:"/dashboard?view=phone-tap",label:es?"Toque móvil":"Phone Tap"},{key:"leads",href:"/dashboard?view=leads",label:es?"Contactos":"Leads"}];
  const title=view==="overview"?(p?(es?"Hola, ":"Hello, ")+p.name.split(" ")[0]+".":(es?"Bienvenido a KopyCat.":"Welcome to KopyCat.")):menu.find(item=>item.key===view)?.label;
  return <main className="dashboard">
    <aside><a className="brand light" href="/"><span>K</span>KopyCat</a><div className="asideLanguage"><LanguageToggle locale={locale} dark/></div><nav>{menu.map(item=><a key={item.key} href={item.href} aria-current={view===item.key?"page":undefined} style={view===item.key?{background:"#477d70",fontWeight:700}:undefined}>{item.label}</a>)}</nav><small>KopyCat</small></aside>
    <section className="dashMain">
      <header><div><small>{es?"PORTAL PROFESIONAL":"PROFESSIONAL PORTAL"}</small><h1>{title}</h1></div><div className="mobileLanguage"><LanguageToggle locale={locale}/></div><Link className="primary" href={p?"/p/"+p.slug:"/dashboard/profile"}>{p?(es?"Ver mi perfil":"View my profile"):(es?"Crear mi perfil":"Create my profile")} ↗</Link></header>
      {view==="overview"&&<div className="metrics"><article><small>{es?"MI PERFIL":"MY PROFILE"}</small><strong>{p?"✓":"—"}</strong><Link href="/dashboard/profile">{p?(es?"Editar perfil":"Edit profile"):(es?"Completa tu perfil":"Complete your profile")}</Link></article><article><small>KOPYPAKS</small><strong>{p?.packs.length||0}</strong><a href="/dashboard/kopypaks">{es?"Ver paquetes":"View packs"}</a></article><article><small>{es?"NUEVAS CONEXIONES":"NEW CONNECTIONS"}</small><strong>{leads.length}</strong><a href="/dashboard?view=leads">{es?"Ver contactos":"View leads"}</a></article></div>}
      {!p&&<article className="panel"><h2>{es?"Primero, crea tu perfil.":"First, create your profile."}</h2><p>{es?"Agrega tu nombre y tus datos para obtener tu enlace público.":"Add your name and details to get your public profile link."}</p><Link className="primary" href="/dashboard/profile">{es?"Crear mi perfil":"Create my profile"} →</Link></article>}
      {(view==="overview"||view==="kopypaks")&&<article className="panel"><h2>KopyPaks</h2><Link className="primary" href="/dashboard/kopypaks">{es?"Administrar KopyPaks":"Manage KopyPaks"} →</Link>{p?.packs.length?p.packs.map(item=><div key={item.id}><h3>{item.title}</h3><p>{item.description}</p><div className="miniDocs">{item.documents.map(d=><a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer"><b>{d.kind}</b> {d.title} ↗</a>)}</div></div>):<p>{es?"Aún no hay KopyPaks. Crea el primero en Administrar KopyPaks.":"No KopyPaks yet. Create your first pack using Manage KopyPaks."}</p>}</article>}
      {(view==="overview"||view==="leads")&&<article className="panel leads"><h2>{es?"Contactos":"Leads"}</h2>{leads.length?leads.map(l=><div className="lead" key={l.id}><i>{l.name[0]}</i><div><b>{l.name}</b><span>{l.email||l.phone}</span><p>{l.message}</p></div></div>):<div className="empty"><b>{es?"Tus nuevos contactos aparecerán aquí.":"Your new leads appear here."}</b><span>{es?"Comparte tu perfil público para recibir mensajes.":"Share your public profile to receive messages."}</span></div>}</article>}
      {(view==="overview"||view==="phone-tap")&&<article className="panel"><h2>{es?"Compartir por toque":"Phone Tap sharing"}</h2>{p&&pack?<TransferCreator profileSlug={p.slug} packSlug={pack.slug} locale={locale}/>:<p>{es?"El envío por toque requiere un perfil guardado y un KopyPak.":"Phone Tap sharing requires a saved profile and a KopyPak."}</p>}</article>}
    </section>
  </main>;
}
