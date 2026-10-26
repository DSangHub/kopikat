"use client";

import {useState} from "react";

export default function PasswordField({label,placeholder}:{label:string;placeholder?:string}){
  const [visible,setVisible]=useState(false);
  return <label>{label}<span className="passwordField"><input name="password" type={visible?"text":"password"} placeholder={placeholder} autoComplete="current-password" required/><button type="button" onClick={()=>setVisible(!visible)} aria-label={visible?"Hide password":"Show password"} aria-pressed={visible}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{visible&&<path d="m4 4 16 16"/>}</svg></button></span></label>;
}
