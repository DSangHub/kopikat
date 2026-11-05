import LanguageToggle from "@/components/LanguageToggle";
import type { Locale } from "@/lib/i18n";

export default function LegalPage({ locale, eyebrow, title, children }: { locale: Locale; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <main className="legalPage">
      <header>
        <a className="brand" href="/"><span>K</span>KopyCat</a>
        <LanguageToggle locale={locale} />
      </header>
      <article>
        <small>{eyebrow}</small>
        <h1>{title}</h1>
        {children}
      </article>
    </main>
  );
}
