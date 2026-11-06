import LegalPage from "@/components/LegalPage";
import { getLocale } from "@/lib/i18n";
import { supportEmail } from "@/lib/site";

export const metadata = { title: "Privacy Policy — KopyCat" };

export default async function Privacy() {
  const locale = await getLocale();
  const es = locale === "es";
  const sections = es ? spanish() : english();
  return (
    <LegalPage locale={locale} eyebrow={es ? "POLÍTICA DE PRIVACIDAD" : "PRIVACY POLICY"} title={es ? "Cómo KopyCat usa la información." : "How KopyCat handles information."}>
      <p>{es ? "Vigente desde el 5 de noviembre de 2026." : "Effective November 5, 2026."}</p>
      {sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
      <p><a href="/account-deletion">{es ? "Cómo eliminar tu cuenta" : "How to delete your account"}</a></p>
      <p><a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
    </LegalPage>
  );
}

function english() {
  return [
    { heading: "Who we are", body: ["KopyCat is a professional handoff service. You build a public profile and KopyPak bundles, then share them by NFC card, QR code, or link. The person who receives a KopyPak does not need an account or the iOS app.", `Questions about this policy go to ${supportEmail}.`] },
    { heading: "Information you give us", body: ["Account email and password, or the identity token from Sign in with Apple, Google, or Facebook if you choose those buttons. We store the session in HTTP-only cookies.", "Profile details you type: name, title, company, phone, public email, location text, and bio. These are published on your public profile.", "KopyPak titles, descriptions, links, and files you upload (PDF, JPG, or PNG up to 750 KB). Files and links on a saved profile are public.", "Leads other people send from your profile: their name, email, phone, and message. Those leads are shown in your dashboard.", "A report of a profile: the profile link, a reason, optional details, and an optional email."] },
    { heading: "Information the phone apps use on the device", body: ["QR scanning: on iPhone, the camera opens only while you tap Scan. On Android, Google Play services shows the scanner. KopyCat does not upload the camera image. Play services may process that frame on the device; KopyCat only receives the text of a KopyCat link.", "NFC: only while you read or write a KopyCat card, and only on phones that have NFC. The card stores the link you already created.", "Contacts: only when you tap Save contact. The phone shows its own contact card so you can save it. KopyCat does not read your address book.", "The share sheet sends the link to an app you pick. KopyCat does not see the destination."] },
    { heading: "What is public", body: ["Your profile, KopyPaks, documents, and links are visible to anyone with the link, QR code, or NFC card. Do not put private documents in a KopyPak.", "A handoff link created from a pack expires after 24 hours. The documents remain on your public profile."] },
    { heading: "Cookies", body: ["kopycat_access_token and kopycat_refresh_token keep you signed in. They are HTTP-only.", "kopycat_oauth_verifier is a short-lived cookie used to finish Google or Facebook sign-in.", "kopycat-language remembers English or Spanish.", "We do not use advertising cookies or a third-party analytics SDK."] },
    { heading: "Who processes it", body: ["KopyCat stores account and profile data in our database. Sign-in is handled by Supabase Authentication. The website is hosted on Vercel.", "If you tap Google, Apple, or Facebook, that provider receives the sign-in request. Apple receives it directly when you use Sign in with Apple on iPhone.", "We do not sell personal information."] },
    { heading: "How long we keep it", body: ["Profile, files, and leads stay until you delete the item or delete your account.", "Deleting your account removes your profile, KopyPaks, uploaded files, leads sent to you, and your sign-in. Messages you sent to someone else's profile stay on that person's account, because they were sent to them.", "Handoff links expire after 24 hours."] },
    { heading: "Delete your account", body: ["In the iPhone app, the Android app, or on the website, open Dashboard, then Account, then Delete my account. You confirm by typing DELETE. The public page at /account-deletion explains the same steps. You can also email the address below and ask us to delete the account."] },
    { heading: "Children", body: ["KopyCat is a tool for working professionals. It is not directed to children under 13, and we do not knowingly collect their information."] },
    { heading: "Contact", body: ["Email the address below to ask a privacy question, request a copy of your information, or report a profile."] },
  ];
}

function spanish() {
  return [
    { heading: "Quiénes somos", body: ["KopyCat es un servicio para compartir tu trabajo. Creas un perfil público y paquetes KopyPak, y los compartes con una tarjeta NFC, un código QR o un enlace. Quien recibe un KopyPak no necesita una cuenta ni la app de iOS.", `Las preguntas sobre esta política van a ${supportEmail}.`] },
    { heading: "Información que nos das", body: ["El correo y la contraseña de tu cuenta, o el token de Sign in with Apple, Google o Facebook si eliges esos botones. Guardamos la sesión en cookies HTTP-only.", "Los datos que escribes en tu perfil: nombre, cargo, empresa, teléfono, correo público, texto de ubicación y biografía. Se publican en tu perfil.", "Títulos, descripciones, enlaces y archivos de tus KopyPaks (PDF, JPG o PNG de hasta 750 KB). Los archivos y enlaces de un perfil guardado son públicos.", "Los contactos que otras personas envían desde tu perfil: nombre, correo, teléfono y mensaje. Aparecen en tu panel.", "Un reporte de un perfil: el enlace, un motivo, detalles opcionales y un correo opcional."] },
    { heading: "Lo que las apps del teléfono usan en el dispositivo", body: ["Escaneo QR: en el iPhone la cámara se abre solo cuando tocas Escanear. En Android, los servicios de Google Play muestran el escáner. KopyCat no sube la imagen. Play services puede procesar ese cuadro en el dispositivo; KopyCat solo recibe el texto de un enlace de KopyCat.", "NFC: solo cuando lees o escribes una tarjeta KopyCat, y solo en teléfonos que tienen NFC. La tarjeta guarda el enlace que ya creaste.", "Contactos: solo cuando tocas Guardar contacto. El teléfono muestra su propia ficha para que la guardes. KopyCat no lee tu agenda.", "La hoja de compartir envía el enlace a la app que elijas. KopyCat no ve el destino."] },
    { heading: "Qué es público", body: ["Tu perfil, tus KopyPaks, documentos y enlaces los ve cualquier persona con el enlace, el QR o la tarjeta NFC. No subas documentos privados.", "Un enlace de entrega creado desde un paquete vence a las 24 horas. Los documentos siguen en tu perfil público."] },
    { heading: "Cookies", body: ["kopycat_access_token y kopycat_refresh_token mantienen tu sesión. Son HTTP-only.", "kopycat_oauth_verifier es una cookie breve para terminar el inicio de sesión con Google o Facebook.", "kopycat-language recuerda inglés o español.", "No usamos cookies de publicidad ni un SDK de analítica de terceros."] },
    { heading: "Quién lo procesa", body: ["KopyCat guarda la cuenta y el perfil en nuestra base de datos. El inicio de sesión lo maneja Supabase Authentication. El sitio está alojado en Vercel.", "Si tocas Google, Apple o Facebook, ese proveedor recibe la solicitud. Apple la recibe directamente cuando usas Sign in with Apple en el iPhone.", "No vendemos información personal."] },
    { heading: "Cuánto tiempo la guardamos", body: ["El perfil, los archivos y los contactos se quedan hasta que borras el elemento o eliminas tu cuenta.", "Eliminar la cuenta quita tu perfil, KopyPaks, archivos, contactos que te enviaron y tu inicio de sesión. Los mensajes que enviaste al perfil de otra persona se quedan en la cuenta de esa persona.", "Los enlaces de entrega vencen a las 24 horas."] },
    { heading: "Elimina tu cuenta", body: ["En la app de iPhone, la app de Android o el sitio, abre el panel, luego Cuenta y Eliminar mi cuenta. Confirmas escribiendo DELETE. La página pública /account-deletion explica los mismos pasos. También puedes escribir al correo de abajo y pedir que eliminemos la cuenta."] },
    { heading: "Menores", body: ["KopyCat es una herramienta para profesionales. No está dirigida a menores de 13 años y no recopilamos sus datos a sabiendas."] },
    { heading: "Contacto", body: ["Escribe al correo de abajo para una pregunta de privacidad, para pedir una copia de tu información o para reportar un perfil."] },
  ];
}
