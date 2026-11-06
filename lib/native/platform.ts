"use client";

import { useEffect, useState } from "react";

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

function nativePlatform(): "ios" | "android" | null {
  if (typeof window === "undefined") return null;
  const cap = (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  const platform = cap.getPlatform?.();
  if (platform === "ios" || platform === "android") return platform;
  if (navigator.userAgent.includes("KopyCatIOS")) return "ios";
  if (navigator.userAgent.includes("KopyCatAndroid")) return "android";
  return null;
}

export function isIosApp() {
  return nativePlatform() === "ios";
}

export function isAndroidApp() {
  return nativePlatform() === "android";
}

export function isNativeApp() {
  return nativePlatform() !== null;
}

export function useIosApp() {
  const [ios, setIos] = useState(false);
  useEffect(() => {
    setIos(isIosApp());
  }, []);
  return ios;
}

export function useAndroidApp() {
  const [android, setAndroid] = useState(false);
  useEffect(() => {
    setAndroid(isAndroidApp());
  }, []);
  return android;
}

export function useNativeApp() {
  const [native, setNative] = useState(false);
  useEffect(() => {
    setNative(isNativeApp());
  }, []);
  return native;
}
