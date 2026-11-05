import Link from "next/link";

export default function LegalLinks({ locale }: { locale: "en" | "es" }) {
  const es = locale === "es";
  return (
    <p className="legalLinks">
      <Link href="/privacy">{es ? "Privacidad" : "Privacy"}</Link>
      <span aria-hidden="true">·</span>
      <Link href="/terms">{es ? "Términos" : "Terms"}</Link>
    </p>
  );
}
