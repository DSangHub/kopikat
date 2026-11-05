"use client";

import { useEffect, useState } from "react";

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

export function isIosApp() {
  if (typeof window === "undefined") return false;
  const cap = (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor;
  if (cap?.isNativePlatform?.() && cap.getPlatform?.() === "ios") return true;
  return navigator.userAgent.includes("KopyCatIOS") && Boolean(cap?.isNativePlatform?.());
}

export function useIosApp() {
  const [ios, setIos] = useState(false);
  useEffect(() => {
    setIos(isIosApp());
  }, []);
  return ios;
}
