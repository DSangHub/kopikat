import { bundleId } from "@/lib/site";

const fingerprint = /^[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){31}$/;

/** SHA-256 signing certificates the owner pastes from Play App Signing. Empty until they do. */
export function androidAssetLinks() {
  const raw = process.env.ANDROID_APP_LINK_SHA256?.trim() || "";
  const fingerprints = raw.split(",").map((item) => item.trim()).filter((item) => fingerprint.test(item));
  if (!fingerprints.length) return null;
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: bundleId,
        sha256_cert_fingerprints: fingerprints.map((item) => item.toUpperCase()),
      },
    },
  ];
}
