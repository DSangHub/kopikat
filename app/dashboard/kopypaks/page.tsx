import Link from "next/link";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {getCurrentUser} from "@/lib/auth";
import {getAccountProfile} from "@/lib/db";
import {savePack,addPackDocument,removePackDocument} from "@/lib/kopypaks";
import {getLocale} from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";
import TransferCreator from "@/components/TransferCreator";
import "../../transfers.css";

const base="/dashboard/kopypaks";
const text=(data:FormData,key:string,max:number)=>String(data.get(key)||"").trim().slice(0,max);
async function account(){const user=await getCurrentUser();if(!user)redirect("/login");return user;}
async function refresh(owner:string){const p=await getAccountProfile(owner);revalidatePath("/dashboard");revalidatePath(base);if(p)revalidatePath("/p/"+p.slug);}
function failure(error:unknown){const code=error instanceof Error?error.message:"unknown";return ["profile","limit","missing","invalid","file","url"].includes(code)?code:"unknown";}
async function save(data:FormData){
  "use server";
  const user=await account();let error="";
  try{const title=text(data,"title",120);if(!title)throw new Error("invalid");await savePack(user.id,text(data,"packId",36),title,text(data,"description",1000));await refresh(user.id);}catch(e){error=failure(e);}
  redirect(base+(error?"?error="+error:"?saved=1"));
}
async function add(data:FormData){
  "use server";
  const user=await account();let error="";
  try{
    const title=text(data,"title",120);if(!title)throw new Error("invalid");
    const upload=data.get("file");let file: {name:string;type:string;bytes:Buffer}|undefined;
    let url=text(data,"url",2048);
    if(upload instanceof File&&upload.size){
      if(upload.size>750000)throw new Error("file");
      const bytes=Buffer.from(await upload.arrayBuffer());
      const type=bytes.subarray(0,5).toString()==="%PDF-"?"application/pdf":bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?"image/png":bytes[0]===255&&bytes[1]===216&&bytes[2]===255?"image/jpeg":"";
      if(!type)throw new Error("file");
      if(url)throw new Error("invalid");
      file={name:upload.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,150)||"document",type,bytes};
    }else{let parsed:URL;try{parsed=new URL(url);}catch{throw new Error("url");}if(!["https:","http:"].includes(parsed.protocol)||parsed.username||parsed.password)throw new Error("url");url=parsed.href;}
    await addPackDocument(user.id,text(data,"packId",36),title,url,file);await refresh(user.id);
  }catch(e){error=failure(e);}
  redirect(base+(error?"?error="+error:"?saved=1"));
}
async function remove(data:FormData){
  "use server";
  const user=await account();let error="";
  try{await removePackDocument(user.id,text(data,"documentId",36));await refresh(user.id);}catch(e){error=failure(e);}
  redirect(base+(error?"?error="+error:"?saved=1"));
}
export default async function KopyPaks({searchParams}:{searchParams:Promise<{error?:string;saved?:string}>}){
  const user=await account();const [profile,locale,params]=await Promise.all([getAccountProfile(user.id),getLocale(),searchParams]);const es=locale==="es";
  const errors:Record<string,string>={profile:es?"Crea tu perfil primero.":"Create your profile first.",limit:es?"Límite: 20 paquetes y 100 documentos por cuenta.":"Limit reached: 20 packs and 100 documents per account.",missing:es?"No se encontró el documento o paquete.":"That document or pack was not found.",invalid:es?"Agrega un título y elige un archivo o un enlace.":"Add a title and choose either a file or a link.",file:es?"Usa un PDF, JPG o PNG de hasta 750 KB.":"Use a PDF, JPG, or PNG up to 750 KB.",url:es?"Ingresa un enlace válido que empiece con https:// o http://.":"Enter a valid link starting with https:// or http://.",unknown:es?"No se pudo guardar. Inténtalo otra vez.":"Could not save. Please try again."};
  const field={display:"block",width:"100%",padding:12,margin:"6px 0 16px",border:"1px solid #b5c5bd",borderRadius:7,font:"inherit"};
  return <main style={{maxWidth:960,margin:"auto",padding:"30px 20px"}}><header style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:20}}><Link href="/dashboard">← {es?"Panel":"Dashboard"}</Link><LanguageToggle locale={locale}/></header><h1>KopyPaks</h1><p>{es?"Agrupa y comparte tus documentos profesionales.":"Organize and share your professional documents."}</p>
    {params.error&&<p role="alert" style={{background:"#ffe4dc",padding:16}}>{errors[params.error]||errors.unknown}</p>}{params.saved&&<p role="status">✓ {es?"Guardado.":"Saved."}</p>}
    {!profile?<article className="panel"><h2>{es?"Crea tu perfil primero":"Create your profile first"}</h2><Link className="primary" href="/dashboard/profile">{es?"Crear perfil":"Create profile"} →</Link></article>:<>
      <p>{es?"Los documentos que guardes serán públicos en tu perfil y en tus enlaces compartidos. No subas documentos privados.":"Documents you save will be public on your profile and shared links. Do not upload private documents."}</p><Link href={"/p/"+profile.slug}>{es?"Ver mi perfil público":"View my public profile"} ↗</Link>
      <article className="panel" style={{marginTop:24}}><h2>{es?"Crear KopyPak":"Create KopyPak"}</h2><form action={save}><label>{es?"Nombre del paquete":"Pack name"}<input style={field} name="title" required maxLength={120} placeholder={es?"Ej. Documentos de mi negocio":"e.g. My business documents"}/></label><label>{es?"Descripción":"Description"}<textarea style={field} name="description" maxLength={1000}/></label><button className="primary" type="submit">{es?"Crear KopyPak":"Create KopyPak"} →</button></form></article>
      {!profile.packs.length&&<p>{es?"Aún no tienes paquetes. Crea el primero arriba.":"No packs yet. Create your first one above."}</p>}
      {profile.packs.map(pack=><article className="panel" key={pack.id} style={{marginTop:24}}><h2>{pack.title}</h2><details><summary>{es?"Editar nombre y descripción":"Edit name and description"}</summary><form action={save}><input type="hidden" name="packId" value={pack.id}/><label>{es?"Nombre":"Name"}<input style={field} name="title" defaultValue={pack.title} required maxLength={120}/></label><label>{es?"Descripción":"Description"}<textarea style={field} name="description" defaultValue={pack.description} maxLength={1000}/></label><button className="primary">{es?"Guardar cambios":"Save changes"}</button></form></details><p>{pack.description}</p>
        <h3>{es?"Documentos":"Documents"} ({pack.documents.length})</h3>{pack.documents.length?<ul>{pack.documents.map(doc=><li key={doc.id} style={{marginBottom:18}}><a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.title} ({doc.kind}) ↗</a><details><summary>{es?"Quitar documento":"Remove document"}</summary><p>{es?"Se quitará de tu perfil y de los enlaces compartidos.":"This removes it from your profile and shared links."}</p><form action={remove}><input type="hidden" name="documentId" value={doc.id}/><button type="submit">{es?"Confirmar eliminación":"Confirm removal"}</button></form></details></li>)}</ul>:<p>{es?"Agrega tu primer documento.":"Add your first document."}</p>}
        <details open={!pack.documents.length}><summary>{es?"Agregar documento o enlace":"Add a document or link"}</summary><form action={add}><input type="hidden" name="packId" value={pack.id}/><label>{es?"Título del documento":"Document title"}<input style={field} name="title" required maxLength={120}/></label><label>{es?"Archivo (PDF, JPG, PNG; hasta 750 KB)":"File (PDF, JPG, PNG; up to 750 KB)"}<input style={field} type="file" name="file" accept=".pdf,.jpg,.jpeg,.png"/></label><p>{es?"O pega un enlace para archivos más grandes:":"Or paste a link for larger files:"}</p><label>URL<input style={field} name="url" type="url" placeholder="https://" maxLength={2048}/></label><button className="primary" type="submit">{es?"Guardar documento público":"Save public document"} →</button></form></details>
        {pack.documents.length>0&&<details style={{marginTop:24}}><summary>{es?"Compartir este KopyPak":"Share this KopyPak"}</summary><TransferCreator profileSlug={profile.slug} packSlug={pack.slug} locale={locale}/></details>}
      </article>)}
    </>}
  </main>;
}
