import LegalPage from "@/components/LegalPage";
import { getLocale } from "@/lib/i18n";
import { supportEmail } from "@/lib/site";

export const metadata = { title: "Terms — KopyCat" };

export default async function Terms() {
  const locale = await getLocale();
  const es = locale === "es";
  const sections = es ? spanish() : english();
  return (
    <LegalPage locale={locale} eyebrow={es ? "TÉRMINOS" : "TERMS"} title={es ? "Las reglas de uso de KopyCat." : "The rules for using KopyCat."}>
      <p>{es ? "Vigentes desde el 5 de noviembre de 2026." : "Effective November 5, 2026."}</p>
      {sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
      <p><a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
    </LegalPage>
  );
}

function english() {
  return [
    { heading: "The service", body: ["KopyCat lets you publish a professional profile and KopyPak bundles, then share them with an NFC card, a QR code, or a link. The iOS app adds a share sheet, NFC reading and writing, QR scanning, and saving a contact on iPhone. The website at kopycat.app is the same product."] },
    { heading: "Your account", body: ["You need an account to create a profile. You can sign up with email or, where it is configured, with Apple, Google, or Facebook. You are responsible for the activity on your account.", "You can delete the account yourself from Dashboard → Account. Deletion removes your profile, KopyPaks, uploaded files, leads sent to you, and your sign-in."] },
    { heading: "Your content", body: ["You keep ownership of the text and files you upload. You give KopyCat permission to store them and show them to anyone who opens your profile, QR code, or NFC card.", "Anything you save on a profile is public. Do not upload private, confidential, or unlawful material.", "You agree that your profile will not impersonate someone else or include content you do not have the right to share."] },
    { heading: "Sharing", body: ["A profile link and a QR code stay available while the profile exists. A handoff link generated for one pack expires after 24 hours.", "Writing an NFC card stores that link on the card. Anyone who taps the card can open it. KopyCat does not transfer data by tapping two phones together."] },
    { heading: "Payments", body: ["The KopyCat app and website do not sell digital goods, subscriptions, or credits. There is no in-app purchase. If you later buy a physical NFC card, that sale happens outside the app."] },
    { heading: "Acceptable use", body: ["Do not use KopyCat to break the law, send malware, harass someone, or publish another person's private information. We can remove a profile that violates these terms. Anyone can report a profile from the report link on that profile."] },
    { heading: "The service can change", body: ["KopyCat is provided as it is available. Profiles depend on an internet connection. An NFC card keeps the link that was written to it, and the page it opens depends on the account still existing."] },
    { heading: "Contact", body: [`Questions about these terms go to ${supportEmail}.`] },
  ];
}

function spanish() {
  return [
    { heading: "El servicio", body: ["KopyCat te permite publicar un perfil profesional y paquetes KopyPak, y compartirlos con una tarjeta NFC, un código QR o un enlace. La app de iOS agrega la hoja de compartir, lectura y escritura NFC, escaneo de QR y guardar un contacto en el iPhone. El sitio kopycat.app es el mismo producto."] },
    { heading: "Tu cuenta", body: ["Necesitas una cuenta para crear un perfil. Puedes registrarte con correo o, si está configurado, con Apple, Google o Facebook. Eres responsable de la actividad en tu cuenta.", "Puedes eliminar la cuenta desde el panel, en Cuenta. La eliminación quita tu perfil, KopyPaks, archivos, contactos que te enviaron y tu inicio de sesión."] },
    { heading: "Tu contenido", body: ["Conservas la propiedad del texto y los archivos que subes. Das permiso a KopyCat para guardarlos y mostrarlos a quien abra tu perfil, QR o tarjeta NFC.", "Todo lo que guardas en un perfil es público. No subas material privado, confidencial o ilegal.", "Aceptas que tu perfil no se hará pasar por otra persona ni incluirá contenido que no tienes derecho a compartir."] },
    { heading: "Compartir", body: ["El enlace del perfil y el código QR siguen disponibles mientras el perfil exista. Un enlace de entrega generado para un paquete vence a las 24 horas.", "Escribir una tarjeta NFC guarda ese enlace en la tarjeta. Quien la toque puede abrirlo. KopyCat no transfiere datos al juntar dos teléfonos."] },
    { heading: "Pagos", body: ["La app y el sitio de KopyCat no venden bienes digitales, suscripciones ni créditos. No hay compras dentro de la app. Si más adelante compras una tarjeta NFC física, esa venta ocurre fuera de la app."] },
    { heading: "Uso aceptable", body: ["No uses KopyCat para infringir la ley, enviar malware, acosar a alguien o publicar información privada de otra persona. Podemos quitar un perfil que viole estos términos. Cualquier persona puede reportar un perfil desde el enlace de reporte."] },
    { heading: "El servicio puede cambiar", body: ["KopyCat se ofrece según esté disponible. Los perfiles dependen de una conexión a internet. Una tarjeta NFC conserva el enlace que se escribió, y la página que abre depende de que la cuenta siga existiendo."] },
    { heading: "Contacto", body: [`Las preguntas sobre estos términos van a ${supportEmail}.`] },
  ];
}
