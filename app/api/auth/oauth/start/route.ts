import { NextResponse } from "next/server";
import { z } from "zod";
import { getOAuthUrl, type OAuthProvider } from "@/lib/auth";
import { isSameOrigin } from "@/lib/http";
import { oauthCallback } from "@/lib/site";

const schema = z.object({ provider: z.enum(["google", "facebook", "apple"]) });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "origin" }, { status: 403 });
  try {
    const input = schema.parse(await request.json());
    const url = await getOAuthUrl(input.provider as OAuthProvider, oauthCallback);
    if (!url) return NextResponse.json({ error: "configuration" }, { status: 503 });
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
}
