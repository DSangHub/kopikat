import { NextResponse } from "next/server";
import { z } from "zod";
import { setAuthSession, signInWithAppleIdToken } from "@/lib/auth";
import { isSameOrigin } from "@/lib/http";

const schema = z.object({
  identityToken: z.string().min(20).max(20000),
  nonce: z.string().min(8).max(256),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "origin" }, { status: 403 });
  try {
    const input = schema.parse(await request.json());
    const session = await signInWithAppleIdToken(input.identityToken, input.nonce);
    if (!session) return NextResponse.json({ error: "apple" }, { status: 401 });
    await setAuthSession(session);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
}
