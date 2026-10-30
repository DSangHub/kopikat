import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentUser} from "@/lib/auth";
import {createTransfer,getAccountProfile} from "@/lib/db";
const schema=z.object({profileSlug:z.string().min(2).max(80),packSlug:z.string().min(2).max(80),recipientEmail:z.string().email().or(z.literal(""))});
export async function POST(request:Request){const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Sign in required"},{status:401});try{const input=schema.parse(await request.json());const profile=await getAccountProfile(user.id);const pack=profile?.packs.find(p=>p.slug===input.packSlug);if(!profile||profile.slug!==input.profileSlug||!pack||!pack.documents.length)return NextResponse.json({error:"Create your own KopyPak and add a document before sharing"},{status:403});return NextResponse.json(await createTransfer(profile.slug,pack.slug,input.recipientEmail),{status:201});}catch{return NextResponse.json({error:"Invalid transfer"},{status:400});}}
