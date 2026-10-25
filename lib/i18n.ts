import {cookies} from "next/headers";

export type Locale="en"|"es";

export async function getLocale():Promise<Locale>{
  return (await cookies()).get("kopycat-language")?.value==="es"?"es":"en";
}
