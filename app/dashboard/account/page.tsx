import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearAuthSession, getCurrentUser } from "@/lib/auth";
import { deleteAccount } from "@/lib/account";
import { getAccountProfile } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";
import LegalLinks from "@/components/LegalLinks";
import { supportEmail } from "@/lib/site";

export const metadata = { title: "Account — KopyCat", robots: { index: false, follow: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; signedOut?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [locale, query] = await Promise.all([getLocale(), searchParams]);
  const es = locale === "es";
  async function signOut() {
    "use server";
    await clearAuthSession();
    redirect("/login");
  }
  async function remove(formData: FormData) {
    "use server";
    const current = await getCurrentUser();
    if (!current) redirect("/login");
    if (String(formData.get("confirm") || "") !== "DELETE") redirect("/dashboard/account?error=confirm");
    const profile = await getAccountProfile(current.id);
    let failed = "";
    try {
      await deleteAccount(current.id);
    } catch (error) {
      failed = error instanceof Error && error.message === "configuration" ? "configuration" : "delete";
    }
    if (failed) redirect(`/dashboard/account?error=${failed}`);
    await clearAuthSession();
    if (profile) revalidatePath(`/p/${profile.slug}`);
    revalidatePath("/dashboard");
    redirect("/?deleted=1");
  }
  const errors: Record<string, string> = es
    ? { confirm: "Escribe DELETE en mayúsculas para confirmar.", configuration: `La eliminación todavía no está lista en el servidor. Tu cuenta sigue activa. Escribe a ${supportEmail} y la eliminaremos.`, delete: "No se pudo eliminar la cuenta. Inténtalo de nuevo." }
    : { confirm: "Type DELETE in capital letters to confirm.", configuration: `Account deletion is not ready on the server yet. Your account is still active. Email ${supportEmail} and we will delete it.`, delete: "The account could not be deleted. Try again." };
  return (
    <main className="authPage">
      <a className="brand" href="/dashboard"><span>K</span>KopyCat</a>
      <div className="authLanguage"><LanguageToggle locale={locale} /></div>
      <div className="authCard" style={{ marginTop: 70, marginBottom: 30, width: "min(600px,100%)" }}>
        <small>{es ? "TU CUENTA" : "YOUR ACCOUNT"}</small>
        <h1>{es ? "Cuenta" : "Account"}</h1>
        <p>{es ? "Sesión iniciada como" : "Signed in as"} <b>{user.email || (es ? "tu cuenta" : "your account")}</b></p>
        {query.error && <p className="authError" role="alert">{errors[query.error] || errors.delete}</p>}
        <form action={signOut}><button className="quietButton" type="submit">{es ? "Cerrar sesión" : "Sign out"}</button></form>
        <LegalLinks locale={locale} />
        <section className="dangerZone">
          <h2>{es ? "Eliminar cuenta" : "Delete account"}</h2>
          <p>{es ? "Esto borra tu perfil público, tus KopyPaks, los archivos que subiste, los contactos que te enviaron y tu inicio de sesión. Los mensajes que enviaste al perfil de otra persona se quedan en esa cuenta." : "This removes your public profile, your KopyPaks, files you uploaded, leads people sent you, and your sign-in. Messages you sent to someone else's profile stay on their account."}</p>
          <form action={remove}>
            <label>{es ? "Escribe DELETE para confirmar" : "Type DELETE to confirm"}
              <input name="confirm" autoComplete="off" required spellCheck={false} aria-describedby="delete-help" />
            </label>
            <p id="delete-help">{es ? "Usa letras mayúsculas: DELETE." : "Use capital letters: DELETE."}</p>
            <button className="dangerButton" type="submit">{es ? "Eliminar mi cuenta" : "Delete my account"}</button>
          </form>
        </section>
        <a className="authLink" href="/dashboard">{es ? "Volver al resumen" : "Back to dashboard"}</a>
      </div>
    </main>
  );
}
