import { appleAppSiteAssociation } from "@/lib/aasa";

export const dynamic = "force-dynamic";

export function GET() {
  const body = appleAppSiteAssociation();
  if (!body) return new Response("Apple Team ID is not configured", { status: 404 });
  return Response.json(body, { headers: { "cache-control": "public, max-age=300" } });
}
