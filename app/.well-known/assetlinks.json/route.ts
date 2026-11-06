import { androidAssetLinks } from "@/lib/assetlinks";

export const dynamic = "force-dynamic";

export function GET() {
  const body = androidAssetLinks();
  if (!body) return new Response("Android App Link certificate is not configured", { status: 404 });
  return Response.json(body, { headers: { "cache-control": "public, max-age=300" } });
}
