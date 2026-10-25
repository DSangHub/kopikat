import {NextResponse} from "next/server";
import {z} from "zod";
import {isAuthenticated} from "@/lib/auth";
import {createTransfer} from "@/lib/db";
const schema=z.object({profileSlug:z.string().min(2).max(80),packSlug:z.string().min(2).max(80),recipientEmail:z.string().email().or(z.literal(""))});
export async function POST(request:Request){if(!await isAuthenticated())return NextResponse.json({error:"Sign in required"},{status:401});try{const input=schema.parse(await request.json());return NextResponse.json(await createTransfer(input.profileSlug,input.packSlug,input.recipientEmail),{status:201});}catch{return NextResponse.json({error:"Invalid transfer"},{status:400});}}
