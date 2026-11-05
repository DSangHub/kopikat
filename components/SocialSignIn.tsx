"use client";

import { useState } from "react";
import { isNativeCancel, openNativeAuthSession, signInWithAppleNative } from "@/lib/native/actions";
import { useIosApp } from "@/lib/native/platform";

function AppleLogo() {
  return (
    <svg viewBox="0 0 18 22" aria-hidden="true">
      <path fill="currentColor" d="M14.8 11.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.9-.8-3.1-.8c-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 3 2.4 1.2 0 1.6-.8 3.1-.8s1.8.8 3.1.7c1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-.9-2.7-3.9zM12.5 4.7c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3z" />
    </svg>
  );
}

export default function SocialSignIn({ locale, oauth }: { locale: "en" | "es"; oauth: (formData: FormData) => void | Promise<void> }) {
  const es = locale === "es";
  const ios = useIosApp();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function apple() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await signInWithAppleNative();
      const response = await fetch("/api/auth/apple", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identityToken: result.identityToken, nonce: result.nonce }),
      });
      if (!response.ok) {
        setError(es ? "Sign in with Apple no está listo. Revisa la configuración de Supabase." : "Sign in with Apple is not ready yet. Check the Supabase Apple provider.");
        return;
      }
      window.location.assign("/dashboard");
    } catch (cause) {
      if (!isNativeCancel(cause)) setError(es ? "No se pudo iniciar sesión con Apple." : "Sign in with Apple could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function provider(name: "google" | "facebook") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/oauth/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: name }),
      });
      const payload = await response.json().catch(() => ({})) as { url?: string };
      if (!response.ok || !payload.url) {
        setError(es ? "El inicio de sesión social necesita configuración." : "Social sign-in needs configuration.");
        return;
      }
      const callback = await openNativeAuthSession(payload.url);
      const returned = new URL(callback.url);
      const code = returned.searchParams.get("code");
      if (!code) {
        setError(es ? "No se pudo iniciar sesión. Inténtalo de nuevo." : "Sign-in failed. Try again.");
        return;
      }
      window.location.assign(`/auth/callback?code=${encodeURIComponent(code)}`);
    } catch (cause) {
      if (!isNativeCancel(cause)) setError(es ? "No se pudo iniciar sesión. Inténtalo de nuevo." : "Sign-in failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!ios) {
    return (
      <form action={oauth} className="authSocialForm">
        <span>{es ? "Continúa con" : "Continue with"}</span>
        <div className="socialButtons">
          <button className="socialButton" name="provider" value="google" type="submit"><b>G</b>Google</button>
          <button className="socialButton" name="provider" value="apple" type="submit"><b>●</b>Apple</button>
          <button className="socialButton" name="provider" value="facebook" type="submit"><b>f</b>Facebook</button>
        </div>
      </form>
    );
  }

  return (
    <div className="authSocialForm">
      <button type="button" className="appleSignIn" onClick={apple} disabled={busy}>
        <AppleLogo />
        {es ? "Iniciar sesión con Apple" : "Sign in with Apple"}
      </button>
      <div className="socialButtons">
        <button type="button" className="socialButton" onClick={() => provider("google")} disabled={busy}><b>G</b>Google</button>
        <button type="button" className="socialButton" onClick={() => provider("facebook")} disabled={busy}><b>f</b>Facebook</button>
      </div>
      {error && <p className="authError" role="alert">{error}</p>}
    </div>
  );
}
