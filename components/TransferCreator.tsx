"use client";
import Image from "next/image";
import {useState} from "react";

export default function TransferCreator({profileSlug,packSlug}:{profileSlug:string;packSlug:string}){
  const [email,setEmail]=useState("");const [transfer,setTransfer]=useState<{url:string;expiresAt:string}|null>(null);const [status,setStatus]=useState("");
  async function create(){setStatus("Creating secure handoff…");const response=await fetch("/api/transfers",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({profileSlug,packSlug,recipientEmail:email})});const data=await response.json();if(!response.ok){setStatus(data.error||"Could not create transfer");return;}setTransfer({url:`${window.location.origin}/accept/${data.token}`,expiresAt:data.expiresAt});setStatus("");}
  return <div className="transferCreator"><small>PHONE TAP & QR HANDOFF</small><h3>Send this KopyPak</h3><p>Create a private link that expires in 24 hours. The recipient previews the documents before accepting.</p><label>Recipient&apos;s KopyCat email (optional)<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="recipient@email.com"/></label><button className="primary" onClick={create}>Create secure handoff →</button>{status&&<p className="formStatus">{status}</p>}{transfer&&<div className="transferReady"><Image src={`/api/qr?url=${encodeURIComponent(transfer.url)}`} width={150} height={150} alt="QR code for this secure KopyCat handoff" unoptimized/><div><b>Ready to tap or scan</b><span>Program this link onto an NFC card, or let the recipient scan the QR code.</span><button onClick={()=>navigator.clipboard.writeText(transfer.url)}>Copy secure link</button><small>Expires {new Date(transfer.expiresAt).toLocaleString()}</small></div></div>}</div>
}
