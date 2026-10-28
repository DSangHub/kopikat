"use client";

import {useFormStatus} from "react-dom";

export default function LoginSubmitButton({idle,pendingLabel}:{idle:string;pendingLabel:string}){
  const {pending}=useFormStatus();
  return <button className="primary" type="submit" disabled={pending} aria-busy={pending}>{pending?pendingLabel:`${idle} →`}</button>;
}
