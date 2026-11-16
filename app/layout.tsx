import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DATASYS — Le numérique au service de vos ambitions",
    template: "%s | DATASYS",
  },
  description:
    "Actualités, activités, annonces et projets de DATASYS. Découvrez nos solutions numériques et notre engagement pour l’innovation.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "fr_SN",
    siteName: "DATASYS",
    title: "DATASYS — Le numérique au service de vos ambitions",
    description:
      "Découvrez les actualités, les activités et les projets de DATASYS.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
