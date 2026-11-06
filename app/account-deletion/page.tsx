import LegalPage from "@/components/LegalPage";
import { getLocale } from "@/lib/i18n";
import { supportEmail } from "@/lib/site";

export const metadata = {
  title: "Delete your KopyCat account",
  description: "How to delete a KopyCat account and the profile data stored with it.",
};

export default async function AccountDeletion() {
  const locale = await getLocale();
  const es = locale === "es";
  return (
    <LegalPage locale={locale} eyebrow={es ? "ELIMINAR CUENTA" : "DELETE YOUR ACCOUNT"} title={es ? "Elimina tu cuenta de KopyCat." : "Delete your KopyCat account."}>
      {es ? (
        <>
          <p>Puedes eliminar la cuenta tú mismo. No hace falta escribirnos primero.</p>
          <ol>
            <li>Inicia sesión en KopyCat en el sitio, en la app de Android o en la app de iPhone.</li>
            <li>Abre el panel, luego Cuenta. En la app, el botón Cuenta también está en la barra inferior.</li>
            <li>En Eliminar cuenta, escribe DELETE en mayúsculas y toca Eliminar mi cuenta.</li>
          </ol>
          <p>Eso quita tu perfil público, tus KopyPaks, los archivos que subiste, los contactos que te enviaron y tu inicio de sesión. Los mensajes que enviaste al perfil de otra persona se quedan en esa cuenta, porque se los enviaste a esa persona.</p>
          <p>Si no puedes entrar, escribe a <a href={`mailto:${supportEmail}`}>{supportEmail}</a> desde el correo de la cuenta y pide la eliminación. Incluye la dirección de la cuenta.</p>
          <p><a href="/login">Iniciar sesión para eliminar la cuenta</a></p>
        </>
      ) : (
        <>
          <p>You can delete the account yourself. You do not have to email us first.</p>
          <ol>
            <li>Sign in to KopyCat on the website, in the Android app, or in the iPhone app.</li>
            <li>Open the dashboard, then Account. In the apps, Account is also on the bottom bar.</li>
            <li>Under Delete account, type DELETE in capital letters and tap Delete my account.</li>
          </ol>
          <p>That removes your public profile, your KopyPaks, files you uploaded, leads people sent you, and your sign-in. Messages you sent to someone else’s profile stay on their account, because you sent those messages to them.</p>
          <p>If you cannot sign in, email <a href={`mailto:${supportEmail}`}>{supportEmail}</a> from the account address and ask for deletion. Include that address in the message.</p>
          <p><a href="/login">Sign in to delete your account</a></p>
        </>
      )}
    </LegalPage>
  );
}
