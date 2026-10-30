"use client";
import Image from "next/image";
import {useId,useState} from "react";

export default function TransferCreator({profileSlug,packSlug,locale="en"}:{profileSlug:string;packSlug:string;locale?:"en"|"es"}){
  const es=locale==="es";const linkId=useId();
  const [transfer,setTransfer]=useState<{url:string;expiresAt:string}|null>(null);
  const [status,setStatus]=useState("");const [busy,setBusy]=useState(false);
  async function create(){
    if(busy)return;setBusy(true);setStatus("");
    try{
      const response=await fetch("/api/transfers",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({profileSlug,packSlug,recipientEmail:""})});
      const data=await response.json();
      if(!response.ok)throw new Error("request");
      setTransfer({url:`${window.location.origin}/accept/${data.token}`,expiresAt:data.expiresAt});
    }catch{setStatus(es?"No se pudo crear el enlace. Revisa tu conexión e inicia sesión otra vez si es necesario.":"Could not create the link. Check your connection and sign in again if needed.");}
    finally{setBusy(false);}
  }
  async function copy(){
    if(!transfer)return;
    try{await navigator.clipboard.writeText(transfer.url);setStatus(es?"Enlace copiado.":"Link copied.");}
    catch{setStatus(es?"Selecciona y copia el enlace que aparece abajo.":"Select and copy the link shown below.");}
  }
  async function share(){
    if(!transfer)return;
    if(!navigator.share){await copy();return;}
    try{await navigator.share({title:"KopyCat KopyPak",text:es?"Abre mi KopyPak":"Open my KopyPak",url:transfer.url});}
    catch(error){if(!(error instanceof Error&&error.name==="AbortError"))await copy();}
  }
  return <div className="transferCreator"><small>{es?"TOQUE MÓVIL Y QR":"PHONE TAP & QR"}</small><h3>{es?"Compartir este KopyPak":"Share this KopyPak"}</h3><p>{es?"Genera un enlace y un QR para este paquete. El enlace de entrega vence en 24 horas. Los documentos también son públicos en tu perfil.":"Generate a link and QR for this pack. The handoff link expires in 24 hours. Documents are also public on your profile."}</p><button type="button" className="primary" disabled={busy} onClick={create}>{busy?(es?"Creando…":"Creating…"):(es?"Crear enlace y QR":"Create link & QR")} →</button>
    {status&&<p className="formStatus" role="status">{status}</p>}
    {transfer&&<div className="transferReady"><Image src={`/api/qr?url=${encodeURIComponent(transfer.url)}`} width={150} height={150} alt={es?"Escanea para abrir este KopyPak":"Scan to open this KopyPak"} unoptimized/><div><b>{es?"Escanea, comparte o programa una etiqueta NFC":"Scan, share, or program an NFC tag"}</b><span>{es?"El destinatario escanea el QR o abre el enlace. Para tocar una tarjeta NFC, escribe este enlace con una app de escritura NFC. No es un envío entre dos teléfonos por contacto.":"The recipient scans the QR or opens the link. For an NFC card tap, write this link using an NFC-writing app. This does not transfer by touching two phones together."}</span><div style={{display:"flex",flexDirection:"row",flexWrap:"wrap",gap:8}}><button type="button" onClick={share}>{es?"Compartir…":"Share…"}</button><button type="button" onClick={copy}>{es?"Copiar enlace":"Copy link"}</button></div><label htmlFor={linkId}>{es?"Enlace de este KopyPak":"This KopyPak link"}</label><input id={linkId} value={transfer.url} readOnly onFocus={e=>e.currentTarget.select()} style={{width:"100%",minWidth:0}}/><small>{es?"Vence":"Expires"} {new Date(transfer.expiresAt).toLocaleString(locale)}</small><span>{es?"Para una tarjeta reutilizable, usa el enlace permanente de tu perfil.":"For a reusable NFC card, use your permanent profile link."}</span></div></div>}
  </div>;
}
