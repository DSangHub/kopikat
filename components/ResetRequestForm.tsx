"use client";

import {useState} from "react";

export default function ResetRequestForm({locale}:{locale:"en"|"es"}){
  const es=locale==="es";const [status,setStatus]=useState("");const [busy,setBusy]=useState(false);
  async function submit(formData:FormData){setBusy(true);setStatus("");await fetch("/api/auth/password-reset/request",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:String(formData.get("email")||"")})});setBusy(false);setStatus(es?"Si existe una cuenta, recibirás un enlace seguro para restablecer la contraseña.":"If an account exists, you will receive a secure password-reset link.");}
  return <form action={submit} className="authCard"><small>{es?"RECUPERAR CONTRASEÑA":"PASSWORD RECOVERY"}</small><h1>{es?"Restablece tu contraseña.":"Reset your password."}</h1><p>{es?"Ingresa el correo de tu cuenta KopyCat.":"Enter the email for your KopyCat account."}</p><label>{es?"Correo electrónico":"Email"}<input name="email" type="email" autoComplete="email" required/></label><button className="primary" disabled={busy}>{busy?(es?"Enviando…":"Sending…"):(es?"Enviar enlace seguro →":"Send secure link →")}</button>{status&&<p className="formStatus" role="status">{status}</p>}<a className="authLink" href="/login">← {es?"Volver a iniciar sesión":"Back to sign in"}</a></form>;
}
