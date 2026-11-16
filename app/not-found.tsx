import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Compass, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";

export const instant = false;

export default function NotFound() {
  return (
    <SiteLayout>
      <section className="error-shell">
        <div className="error-orbit error-orbit-one" aria-hidden="true" />
        <div className="error-orbit error-orbit-two" aria-hidden="true" />
        <div className="container error-content">
          <span className="section-kicker"><Compass size={15} aria-hidden="true" /> ERREUR 404</span>
          <span className="error-code" aria-hidden="true">404</span>
          <h1>Cette page a changé <em>de trajectoire.</em></h1>
          <p>
            Le lien que vous avez suivi n’existe plus ou a été déplacé. Pas d’inquiétude :
            tout le reste de notre univers numérique vous attend.
          </p>
          <div className="error-actions">
            <Link className="button button-primary" href="/">
              <ArrowLeft size={16} /> Revenir à l’accueil
            </Link>
            <Link className="outlined-link" href="/actualites">
              Explorer nos actualités <ArrowUpRight size={15} />
            </Link>
          </div>
          <span className="error-signature"><Sparkles size={14} /> DATASYS · Le numérique au service de vos ambitions</span>
        </div>
      </section>
    </SiteLayout>
  );
}
