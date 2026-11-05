import { redirect } from "next/navigation";
import LegalPage from "@/components/LegalPage";
import { getLocale } from "@/lib/i18n";
import { createProfileReport } from "@/lib/reports";
import { supportEmail } from "@/lib/site";

export const metadata = { title: "Report a profile — KopyCat", robots: { index: false, follow: false } };

const reasons = ["spam", "impersonation", "inappropriate", "other"] as const;

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ profile?: string; sent?: string; error?: string }> }) {
  const [locale, query] = await Promise.all([getLocale(), searchParams]);
  const es = locale === "es";
  const profile = (query.profile || "").replace(/[^a-z0-9-]/gi, "").slice(0, 80);
  async function send(formData: FormData) {
    "use server";
    if (String(formData.get("company_website") || "")) redirect("/report?sent=1");
    const slug = String(formData.get("profile") || "").replace(/[^a-z0-9-]/gi, "").slice(0, 80);
    const reason = String(formData.get("reason") || "");
    const details = String(formData.get("details") || "").trim().slice(0, 2000);
    const email = String(formData.get("email") || "").trim().slice(0, 254);
    if (!/^[a-z0-9-]{2,80}$/i.test(slug) || !reasons.includes(reason as typeof reasons[number])) redirect(`/report?profile=${slug}&error=invalid`);
    try {
      await createProfileReport({ profileSlug: slug, reason, details, reporterEmail: email });
    } catch {
      redirect(`/report?profile=${slug}&error=unavailable`);
    }
    redirect("/report?sent=1");
  }
  const reasonLabels = es
    ? { spam: "Spam", impersonation: "Se hace pasar por otra persona", inappropriate: "Contenido inapropiado", other: "Otra razón" }
    : { spam: "Spam", impersonation: "Pretends to be someone else", inappropriate: "Inappropriate content", other: "Another reason" };
  return (
    <LegalPage locale={locale} eyebrow={es ? "REPORTAR" : "REPORT"} title={es ? "Reportar un perfil" : "Report a profile"}>
      {query.sent ? <p role="status">{es ? "Recibimos el reporte. Gracias." : "We received the report. Thank you."}</p> : (
        <form action={send} className="leadForm">
          {query.error === "unavailable" && <p className="authError" role="alert">{es ? `No se pudo guardar el reporte. Escribe a ${supportEmail}.` : `The report could not be saved. Email ${supportEmail}.`}</p>}
          {query.error === "invalid" && <p className="authError" role="alert">{es ? "Elige un motivo y un perfil válido." : "Choose a reason and a valid profile."}</p>}
          <label>{es ? "Perfil" : "Profile"}
            <input name="profile" defaultValue={profile} required maxLength={80} pattern="[A-Za-z0-9-]{2,80}" />
          </label>
          <label>{es ? "Motivo" : "Reason"}
            <select name="reason" defaultValue="spam" required>
              {reasons.map((reason) => <option key={reason} value={reason}>{reasonLabels[reason]}</option>)}
            </select>
          </label>
          <label>{es ? "Detalles" : "Details"}
            <textarea name="details" maxLength={2000} rows={4} />
          </label>
          <label>{es ? "Tu correo (opcional)" : "Your email (optional)"}
            <input name="email" type="email" maxLength={254} autoComplete="email" />
          </label>
          <label className="reportHoneypot">Website<input name="company_website" tabIndex={-1} autoComplete="off" /></label>
          <button className="primary" type="submit">{es ? "Enviar reporte" : "Send report"}</button>
        </form>
      )}
      <p><a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
    </LegalPage>
  );
}
