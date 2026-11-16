"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, RefreshCw, TriangleAlert } from "lucide-react";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="public-site error-standalone">
      <header className="error-brand">
        <Link href="/" aria-label="DATASYS — retour à l’accueil">
          <Image src="/datasys-logo-horizontal.png" alt="DATASYS" width={625} height={320} priority unoptimized />
        </Link>
      </header>
      <main className="error-shell" id="main-content">
        <div className="error-orbit error-orbit-one" aria-hidden="true" />
        <div className="error-orbit error-orbit-two" aria-hidden="true" />
        <div className="container error-content">
          <span className="section-kicker"><TriangleAlert size={15} aria-hidden="true" /> INCIDENT TECHNIQUE</span>
          <span className="error-code" aria-hidden="true">500</span>
          <h1>Un imprévu a interrompu <em>le parcours.</em></h1>
          <p>
            Une erreur inattendue est survenue pendant le chargement de cette page.
            Vous pouvez réessayer immédiatement ou revenir à l’accueil.
          </p>
          <div className="error-actions">
            <button className="button button-primary" type="button" onClick={reset}>
              <RefreshCw size={16} /> Réessayer
            </button>
            <Link className="outlined-link" href="/">
              <ArrowLeft size={15} /> Revenir à l’accueil
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
