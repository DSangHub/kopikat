"use client";

import { isProductionKopyCatUrl, isKopyCatUrl } from "@/lib/site";
import { isIosApp } from "@/lib/native/platform";

export function isNativeCancel(error: unknown) {
  if (error instanceof Error && (error.name === "AbortError" || error.name === "NotAllowedError")) return error.name === "AbortError";
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  const message = error instanceof Error ? error.message : "message" in error ? String((error as { message?: string }).message) : "";
  return code === "canceled" || /cancel/i.test(message);
}

export function nativeErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "";
  return String((error as { code?: string }).code || "");
}

export function nativeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: string }).message || "");
    if (message) return message;
  }
  return fallback;
}

async function plugin() {
  const { KopyCatNative } = await import("@kopycat/native");
  return KopyCatNative;
}

export async function haptic(style: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "light") {
  if (!isIosApp()) return;
  try {
    const native = await plugin();
    await native.haptic({ style });
  } catch {
    return;
  }
}

export async function shareLink(options: { title: string; text?: string; url: string }) {
  if (isIosApp()) {
    const native = await plugin();
    await haptic("light");
    const result = await native.share(options);
    if (result.completed) await haptic("success");
    return result.completed ? "shared" as const : "dismissed" as const;
  }
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    await navigator.share({ title: options.title, text: options.text, url: options.url });
    return "shared" as const;
  }
  await navigator.clipboard.writeText(options.url);
  return "copied" as const;
}

export async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
  await haptic("success");
}

export async function scanKopyCatQr(options: { prompt: string; cancelLabel: string }) {
  const native = await plugin();
  await haptic("light");
  const result = await native.scanQr(options);
  const currentHost = typeof window === "undefined" ? undefined : window.location.host;
  if (!isKopyCatUrl(result.text, currentHost)) {
    throw Object.assign(new Error("That code is not a KopyCat link."), { code: "invalid" });
  }
  await haptic("success");
  return result.text;
}

export async function writeNfcLink(options: { url: string; message: string; successMessage: string }) {
  if (!isProductionKopyCatUrl(options.url)) {
    throw Object.assign(new Error("Only a kopycat.app link can be written to a card."), { code: "invalid" });
  }
  const native = await plugin();
  await haptic("light");
  await native.writeNfc(options);
  await haptic("success");
}

export async function readNfcLink(message: string) {
  const native = await plugin();
  await haptic("light");
  const result = await native.readNfc({ message });
  const currentHost = typeof window === "undefined" ? undefined : window.location.host;
  if (!isKopyCatUrl(result.text, currentHost)) {
    throw Object.assign(new Error("That card does not open a KopyCat link."), { code: "invalid" });
  }
  await haptic("success");
  return result.text;
}

export async function saveNativeContact(input: { name: string; phone?: string; email?: string; company?: string; title?: string; url?: string }) {
  const native = await plugin();
  await haptic("light");
  await native.saveContact(input);
  await haptic("success");
}

export async function signInWithAppleNative() {
  const native = await plugin();
  return native.signInWithApple();
}

export async function openNativeAuthSession(url: string) {
  const native = await plugin();
  return native.openAuthSession({ url, callbackScheme: "kopycat" });
}

export async function openAppSettings() {
  const native = await plugin();
  await native.openSettings();
}
