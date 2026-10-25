import {NextResponse} from "next/server";
import {z} from "zod";
import {acceptTransfer} from "@/lib/db";
const schema=z.object({email:z.string().email()});
export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){try{const {token}=await params;const {email}=schema.parse(await request.json());const result=await acceptTransfer(token,email);return result?NextResponse.json(result):NextResponse.json({error:"Transfer unavailable"},{status:409});}catch{return NextResponse.json({error:"Enter a valid KopyCat email"},{status:400});}}
