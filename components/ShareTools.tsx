"use client";

import Image from "next/image";
import { useState } from "react";
import { copyText, isNativeCancel, shareLink } from "@/lib/native/actions";

export default function ShareTools({ slug, locale = "en" }: { slug: string; locale?: "en" | "es" }) {
  const es = locale === "es";
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/p/${slug}`;

  async function share() {
    if (!url) return;
    try {
      const result = await shareLink({ title: "KopyCat", text: es ? "Mira mi perfil de KopyCat" : "See my KopyCat profile", url });
      setStatus(result === "copied" ? (es ? "Enlace copiado." : "Link copied.") : "");
      if (result !== "dismissed") setOpen(false);
    } catch (error) {
      if (isNativeCancel(error)) return;
      try {
        await copyText(url);
        setStatus(es ? "Enlace copiado." : "Link copied.");
        setOpen(false);
      } catch {
        setStatus(es ? "No se pudo compartir." : "Could not share.");
      }
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await copyText(url);
      setStatus(es ? "Enlace copiado." : "Link copied.");
      setOpen(false);
    } catch {
      setStatus(es ? "Selecciona y copia el enlace." : "Select and copy the link.");
    }
  }

  return (
    <div className="shareWrap">
      <button className="shareButton" type="button" onClick={() => setOpen(!open)}>{es ? "Compartir" : "Share"} ↗</button>
      {open && (
        <div className="shareMenu">
          <Image src={`/api/qr?slug=${encodeURIComponent(slug)}`} width={120} height={120} alt={es ? "Código QR de este perfil KopyCat" : "QR code for this KopyCat profile"} unoptimized />
          <p>{es ? "Escanea o copia este perfil" : "Scan or copy this profile"}</p>
          <button type="button" onClick={share}>{es ? "Compartir…" : "Share…"}</button>
          <button type="button" onClick={copy}>{es ? "Copiar enlace" : "Copy link"}</button>
          {status && <p role="status">{status}</p>}
        </div>
      )}
    </div>
  );
}
