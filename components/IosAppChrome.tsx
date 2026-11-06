"use client";

import { useEffect, useState } from "react";
import { isNativeCancel, nativeErrorCode, nativeErrorMessage, openAppSettings, readNfcLink, scanKopyCatQr } from "@/lib/native/actions";
import { isIosApp, isNativeApp } from "@/lib/native/platform";
import { isKopyCatUrl } from "@/lib/site";

export default function IosAppChrome({ locale }: { locale: "en" | "es" }) {
  const es = locale === "es";
  const [native, setNative] = useState(false);
  const [offline, setOffline] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isNativeApp()) return;
    setNative(true);
    document.body.classList.add("native-app");
    if (isIosApp()) document.body.classList.add("ios-app");
    let active = true;
    let listener: { remove: () => Promise<void> | void } | undefined;
    const openUrl = (value: string) => {
      try {
        const parsed = new URL(value);
        if (parsed.protocol === "kopycat:") {
          const code = parsed.searchParams.get("code");
          if (code) window.location.assign(`/auth/callback?code=${encodeURIComponent(code)}`);
          return;
        }
        if (!isKopyCatUrl(value, window.location.host)) return;
        const next = `${parsed.pathname}${parsed.search}${parsed.hash}`;
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (next !== current) window.location.assign(parsed.href);
      } catch {
        return;
      }
    };
    const boot = async () => {
      const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
        import("@capacitor/status-bar"),
        import("@capacitor/splash-screen"),
        import("@capacitor/app"),
      ]);
      if (!active) return;
      await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => undefined);
      await StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
      if (!active) return;
      listener = await App.addListener("appUrlOpen", (event) => openUrl(event.url));
      if (!active) {
        void listener.remove();
        return;
      }
      const launch = await App.getLaunchUrl();
      if (launch?.url) openUrl(launch.url);
      await SplashScreen.hide().catch(() => undefined);
    };
    boot().catch(() => undefined);
    const online = () => setOffline(false);
    const offlineListener = () => setOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", offlineListener);
    setOffline(!navigator.onLine);
    return () => {
      active = false;
      document.body.classList.remove("native-app");
      document.body.classList.remove("ios-app");
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offlineListener);
      void listener?.remove();
    };
  }, []);

  async function scan() {
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      const url = await scanKopyCatQr({
        prompt: es ? "Escanea un código QR de KopyCat" : "Scan a KopyCat QR code",
        cancelLabel: es ? "Cancelar" : "Cancel",
      });
      window.location.assign(url);
    } catch (error) {
      if (isNativeCancel(error)) return;
      if (nativeErrorCode(error) === "denied") {
        setStatus(es ? "Activa la cámara en Ajustes para escanear." : "Turn on Camera in Settings to scan.");
        await openAppSettings().catch(() => undefined);
        return;
      }
      setStatus(nativeErrorMessage(error, es ? "No se pudo escanear." : "The code could not be scanned."));
    } finally {
      setBusy(false);
    }
  }

  async function readCard() {
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      const url = await readNfcLink(isIosApp()
        ? (es ? "Acerca el iPhone a una tarjeta KopyCat." : "Hold your iPhone near a KopyCat card.")
        : (es ? "Acerca la parte de atrás del teléfono a una tarjeta KopyCat." : "Hold the back of your phone near a KopyCat card."));
      window.location.assign(url);
    } catch (error) {
      if (!isNativeCancel(error)) {
        const code = nativeErrorCode(error);
        setStatus(code === "unavailable"
          ? (es ? "Este dispositivo no lee tarjetas NFC." : "This device cannot read NFC cards.")
          : code === "nfc_disabled"
            ? (es ? "Activa NFC en los ajustes del teléfono y vuelve a intentarlo." : "Turn on NFC in your phone settings, then try again.")
            : nativeErrorMessage(error, es ? "No se leyó un enlace de KopyCat." : "A KopyCat link was not read."));
      }
    } finally {
      setBusy(false);
    }
  }

  if (!native) return null;
  return (
    <>
      {offline && <p className="offlineBanner" role="status">{es ? "Sin conexión. Tus KopyPaks se abrirán cuando vuelva la red." : "You're offline. Your KopyPaks will open when the connection returns."}</p>}
      <div className="iosAppDock">
        {status && <p role="status">{status}</p>}
        <nav className="iosAppBar" aria-label={es ? "Acciones de la app" : "App actions"}>
          <a href="/dashboard">{es ? "Inicio" : "Home"}</a>
          <button type="button" onClick={scan} disabled={busy}>{es ? "Escanear" : "Scan"}</button>
          <button type="button" onClick={readCard} disabled={busy}>NFC</button>
          <a href="/dashboard?view=phone-tap">{es ? "Tarjeta" : "Card"}</a>
          <a href="/dashboard/account">{es ? "Cuenta" : "Account"}</a>
        </nav>
      </div>
    </>
  );
}
