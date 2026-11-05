export const supportEmail = "privacy@kopycat.app";
export const bundleId = "app.kopycat";
export const productionHosts = ["www.kopycat.app", "kopycat.app"] as const;
export const oauthCallback = "kopycat://auth-callback";

export function isKopyCatUrl(value: string, currentHost?: string) {
  try {
    const url = new URL(value);
    if (url.username || url.password) return false;
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (currentHost && url.host === currentHost) return true;
    return url.protocol === "https:" && (productionHosts as readonly string[]).includes(url.host);
  } catch {
    return false;
  }
}

export function isProductionKopyCatUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && (productionHosts as readonly string[]).includes(url.host);
  } catch {
    return false;
  }
}
