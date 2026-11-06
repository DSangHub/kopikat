"use client";

import { useState } from "react";
import { saveNativeContact, isNativeCancel, nativeErrorCode, openAppSettings } from "@/lib/native/actions";
import { useNativeApp } from "@/lib/native/platform";
import { buildVcard } from "@/lib/vcard";

export default function SaveContactButton({
  locale = "en",
  name,
  phone,
  email,
  company,
  title,
  slug,
  fileName,
}: {
  locale?: "en" | "es";
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  title?: string;
  slug: string;
  fileName: string;
}) {
  const es = locale === "es";
  const native = useNativeApp();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveNative() {
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      const url = `${window.location.origin}/p/${slug}`;
      await saveNativeContact({ name, phone, email, company, title, url });
      setStatus(es ? "Contacto listo para guardar." : "Contact ready to save.");
    } catch (error) {
      if (isNativeCancel(error)) return;
      if (nativeErrorCode(error) === "denied") {
        setStatus(es ? "Activa Contactos en Ajustes para guardar esta persona." : "Turn on Contacts in Settings to save this person.");
        await openAppSettings().catch(() => undefined);
        return;
      }
      setStatus(es ? "No se pudo abrir Contactos." : "Contacts could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    const url = `${window.location.origin}/p/${slug}`;
    const card = buildVcard({ name, phone, email, company, title, url });
    const blob = new Blob([card], { type: "text/vcard" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${fileName}.vcf`;
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <>
      <button type="button" className="primary" disabled={busy} onClick={native ? saveNative : download}>
        {busy ? (es ? "Abriendo…" : "Opening…") : (es ? "Guardar contacto" : "Save contact")}
      </button>
      {status && <p className="formStatus" role="status">{status}</p>}
    </>
  );
}
