import type { CSSProperties, ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteSettings } from "@/lib/site-info";

export async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <div
      className="public-site"
      style={{
        "--navy": settings.primaryColor,
        "--navy-deep": settings.deepColor,
        "--green": settings.accentColor,
        "--gold": settings.accentColor,
        "--red": settings.accentColor,
      } as CSSProperties}
    >
      <a className="skip-link" href="#main-content">Aller au contenu principal</a>
      <SiteHeader settings={settings} />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <SiteFooter settings={settings} />
      <span className="site-grain" aria-hidden="true" />
    </div>
  );
}
