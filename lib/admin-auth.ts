import postgres from "postgres";
import {createHash,randomBytes,scryptSync,timingSafeEqual} from "node:crypto";

const sql=process.env.DATABASE_URL?postgres(process.env.DATABASE_URL,{prepare:false,max:1,ssl:"require"}):null;

function passwordHash(password:string){const salt=randomBytes(16).toString("hex");const hash=scryptSync(password,salt,64).toString("hex");return `${salt}:${hash}`;}
function verifyHash(password:string,stored:string){try{const [salt,hash]=stored.split(":");const expected=Buffer.from(hash,"hex");const actual=scryptSync(password,salt,64);return expected.length===actual.length&&timingSafeEqual(expected,actual);}catch{return false;}}
const tokenHash=(token:string)=>createHash("sha256").update(token).digest("hex");

export async function verifyStoredAdmin(email:string,password:string){if(!sql)return false;try{const rows=await sql`SELECT password_hash FROM admin_credentials WHERE lower(email)=lower(${email}) LIMIT 1`;return rows.length>0&&verifyHash(password,String(rows[0].password_hash));}catch{return false;}}
export async function ensureAdminCredential(email:string,password:string){if(!sql)return;try{await sql`INSERT INTO admin_credentials (email,password_hash) VALUES (${email.toLowerCase()},${passwordHash(password)}) ON CONFLICT (email) DO NOTHING`;}catch{return;}}
export async function createPasswordReset(email:string){if(!sql)return null;try{const admins=await sql`SELECT email FROM admin_credentials WHERE lower(email)=lower(${email}) LIMIT 1`;if(!admins.length)return null;const token=randomBytes(32).toString("base64url");await sql`DELETE FROM password_reset_tokens WHERE email=lower(${email}) OR expires_at<now()`;await sql`INSERT INTO password_reset_tokens (email,token_hash,expires_at) VALUES (lower(${email}),${tokenHash(token)},now()+interval '30 minutes')`;return token;}catch{return null;}}
export async function completePasswordReset(token:string,password:string){if(!sql||password.length<10)return false;try{const rows=await sql`SELECT email FROM password_reset_tokens WHERE token_hash=${tokenHash(token)} AND used_at IS NULL AND expires_at>now() LIMIT 1`;if(!rows.length)return false;const email=String(rows[0].email);await sql`UPDATE admin_credentials SET password_hash=${passwordHash(password)},updated_at=now() WHERE email=${email}`;await sql`UPDATE password_reset_tokens SET used_at=now() WHERE token_hash=${tokenHash(token)}`;return true;}catch{return false;}}
