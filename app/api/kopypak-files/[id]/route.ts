import {getPackFile} from "@/lib/kopypaks";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const file=await getPackFile((await params).id);
  if(!file)return new Response("Not found",{status:404});
  return new Response(new Uint8Array(file.body),{headers:{"Content-Type":file.content_type,"Content-Disposition":`attachment; filename="${file.filename.replace(/[^a-zA-Z0-9._-]/g,"_")}"`,"X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; sandbox","Cache-Control":"private, no-store"}});
}
