"use client";

import { useEffect, useState } from "react";
import { isNativeCancel, nativeErrorCode, writeNfcLink } from "@/lib/native/actions";
import { useIosApp } from "@/lib/native/platform";

export default function NfcWriteButton({ url, locale = "en" }: { url: string; locale?: "en" | "es" }) {
  const es = locale === "es";
  const ios = useIosApp();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  if (!ios) return null;

  async function write() {
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      await writeNfcLink({
        url,
        message: es ? "Acerca la parte superior del iPhone a la tarjeta NFC." : "Hold the top of your iPhone near the NFC card.",
        successMessage: es ? "La tarjeta KopyCat está lista." : "This KopyCat card is ready.",
      });
      setStatus(es ? "Enlace escrito en la tarjeta." : "Link written to the card.");
    } catch (error) {
      if (!isNativeCancel(error)) {
        const unavailable = nativeErrorCode(error) === "unavailable";
        setStatus(unavailable
          ? (es ? "Este dispositivo no puede escribir tarjetas NFC." : "This device cannot write NFC cards.")
          : (es ? "No se pudo escribir la tarjeta. Acércala de nuevo." : "The card could not be written. Hold it near the top of the iPhone and try again."));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={write} disabled={busy}>{busy ? (es ? "Escribiendo…" : "Writing…") : (es ? "Escribir en tarjeta NFC" : "Write to NFC card")}</button>
      {status && <p className="formStatus" role="status">{status}</p>}
    </>
  );
}

export function NfcWritePath({ path, locale = "en" }: { path: string; locale?: "en" | "es" }) {
  const ios = useIosApp();
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
  }, [path]);
  if (!ios || !url) return null;
  return <NfcWriteButton url={url} locale={locale} />;
}
