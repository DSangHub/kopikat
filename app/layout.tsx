import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import IosAppChrome from "@/components/IosAppChrome";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "KopyCat — Tap it. Kopy it. Keep it.",
  description: "Share your professional package in one tap.",
  applicationName: "KopyCat",
  appleWebApp: { capable: true, title: "KopyCat", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f0e6",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className={`${sans.variable} ${display.variable}`}>
        {children}
        <IosAppChrome locale={locale} />
      </body>
    </html>
  );
}
