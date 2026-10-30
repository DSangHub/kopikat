import "server-only";
import postgres from "postgres";
import {randomUUID} from "node:crypto";

const sql=process.env.DATABASE_URL?postgres(process.env.DATABASE_URL,{prepare:false,max:1,ssl:"require"}):null;
export const uuid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export async function savePack(owner:string,id:string,title:string,description:string){
  if(!sql)throw new Error("database");
  return sql.begin(async tx=>{
    const profile=await tx`SELECT id FROM profiles WHERE id=${owner} FOR UPDATE`;
    if(!profile.length)throw new Error("profile");
    if(id){
      if(!uuid(id))throw new Error("invalid");
      const rows=await tx`UPDATE packs SET title=${title},description=${description} WHERE id=${id} AND profile_id=${owner} RETURNING id`;
      if(!rows.length)throw new Error("missing");
      return id;
    }
    const count=await tx`SELECT count(*)::int AS n FROM packs WHERE profile_id=${owner}`;
    if(count[0].n>=20)throw new Error("limit");
    const newId=randomUUID();
    await tx`INSERT INTO packs(id,profile_id,slug,title,description) VALUES(${newId},${owner},${"pack-"+newId},${title},${description})`;
    return newId;
  });
}
export async function addPackDocument(owner:string,packId:string,title:string,url:string,file?:{name:string;type:string;bytes:Buffer}){
  if(!sql)throw new Error("database");
  if(!uuid(packId))throw new Error("invalid");
  return sql.begin(async tx=>{
    const profile=await tx`SELECT id FROM profiles WHERE id=${owner} FOR UPDATE`;
    if(!profile.length)throw new Error("profile");
    const packs=await tx`SELECT id FROM packs WHERE id=${packId} AND profile_id=${owner}`;
    if(!packs.length)throw new Error("missing");
    const count=await tx`SELECT count(*)::int AS n FROM documents d JOIN packs p ON p.id=d.pack_id WHERE p.profile_id=${owner}`;
    if(count[0].n>=100)throw new Error("limit");
    const id=randomUUID();
    await tx`INSERT INTO documents(id,pack_id,title,kind,url) VALUES(${id},${packId},${title},${file?(file.type==="application/pdf"?"PDF":"IMAGE"):"LINK"},${file?"/api/kopypak-files/"+id:url})`;
    if(file)await tx`INSERT INTO kopypak_files(document_id,filename,content_type,body) VALUES(${id},${file.name},${file.type},${file.bytes})`;
    return id;
  });
}
export async function removePackDocument(owner:string,id:string){
  if(!sql)throw new Error("database");
  if(!uuid(id))throw new Error("invalid");
  const rows=await sql`DELETE FROM documents d USING packs p WHERE d.id=${id} AND d.pack_id=p.id AND p.profile_id=${owner} RETURNING d.id`;
  if(!rows.length)throw new Error("missing");
}
export async function getPackFile(id:string){
  if(!sql||!uuid(id))return null;
  const rows=await sql`SELECT f.filename,f.content_type,f.body FROM kopypak_files f JOIN documents d ON d.id=f.document_id JOIN packs p ON p.id=d.pack_id JOIN profiles pr ON pr.id=p.profile_id WHERE f.document_id=${id} LIMIT 1`;
  return rows[0]||null;
}
