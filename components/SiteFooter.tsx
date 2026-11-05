import Link from "next/link";

export default function SiteFooter({ locale }: { locale: "en" | "es" }) {
  const es = locale === "es";
  return (
    <footer className="siteFooter">
      <Link href="/privacy">{es ? "Privacidad" : "Privacy"}</Link>
      <Link href="/terms">{es ? "Términos" : "Terms"}</Link>
      <Link href="/login">{es ? "Acceso profesional" : "Professional login"}</Link>
    </footer>
  );
}
