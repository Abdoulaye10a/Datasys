import Image from "next/image";

export type SolutionVariant = "annonces" | "bataki" | "cenou" | "immo";

function AnnoncesPreview() {
  return (
    <div className="preview preview-annonces" aria-hidden="true">
      <div className="preview-window">
        <div className="preview-chrome">
          <span className="preview-dots"><i /><i /><i /></span>
          <span className="preview-url">annoncesmali.com</span>
          <span className="preview-live"><i /> En ligne</span>
        </div>
        <div className="preview-app">
          <div className="preview-topbar">
            <span className="preview-mark">AM</span>
            <span className="preview-brandname">Annonces Mali</span>
            <span className="preview-search"><i /> Rechercher un emploi</span>
            <span className="preview-pill">Publier une offre</span>
          </div>
          <div className="preview-jobs">
            <div className="preview-job">
              <span className="preview-logo preview-logo-a">DW</span>
              <span className="preview-job-copy"><strong>Développeur web</strong><small>Technologie · Bamako</small></span>
              <span className="preview-tag">CDI</span>
            </div>
            <div className="preview-job">
              <span className="preview-logo preview-logo-b">AC</span>
              <span className="preview-job-copy"><strong>Assistant comptable</strong><small>Finance · Bamako</small></span>
              <span className="preview-tag">CDD</span>
            </div>
            <div className="preview-job">
              <span className="preview-logo preview-logo-c">CT</span>
              <span className="preview-job-copy"><strong>Chargé commercial</strong><small>Vente · Ségou</small></span>
              <span className="preview-tag preview-tag-soft">Stage</span>
            </div>
          </div>
          <div className="preview-metrics">
            <span><strong>120+</strong><small>offres actives</small></span>
            <span><strong>2 400</strong><small>candidats</small></span>
            <span><strong>48 h</strong><small>pour recruter</small></span>
          </div>
        </div>
      </div>
      <span className="preview-float preview-float-annonces"><i /> Nouvelle candidature reçue</span>
    </div>
  );
}

function BatakiPreview() {
  return (
    <div className="preview preview-bataki" aria-hidden="true">
      <div className="preview-phone">
        <span className="preview-speaker" />
        <div className="preview-phone-screen">
          <div className="preview-phone-bar"><span>9:41</span><i /></div>
          <div className="preview-app-title">
            <span className="preview-mark preview-mark-green">B+</span>
            <strong>BatakiPlus</strong>
          </div>
          <div className="preview-chat">
            <p className="preview-bubble">Votre campagne est prête à être envoyée.</p>
            <p className="preview-bubble preview-bubble-out">Envoyer à 12 480 contacts <span>✓</span></p>
            <p className="preview-bubble">Campagne programmée pour demain, 08 h 00.</p>
          </div>
          <span className="preview-phone-cta">Nouvelle campagne</span>
        </div>
      </div>
      <div className="preview-panel">
        <span className="preview-panel-label">Campagne SMS</span>
        <strong className="preview-panel-value">12 480</strong>
        <small>messages envoyés</small>
        <div className="preview-chart"><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="preview-panel-foot"><span>98 % délivrés</span><span>+ 24 %</span></div>
      </div>
    </div>
  );
}

function CenouPreview() {
  return (
    <div className="preview preview-cenou" aria-hidden="true">
      <div className="preview-phone preview-phone-cenou">
        <span className="preview-speaker" />
        <div className="preview-phone-screen">
          <div className="preview-campus">
            <span className="preview-campus-kicker">CENOU MALI</span>
            <strong>Espace étudiant</strong>
          </div>
          <div className="preview-dossier">
            <span className="preview-dossier-mark">D</span>
            <span className="preview-dossier-copy"><strong>Dossier de bourse</strong><small>2025 — 2026</small></span>
            <span className="preview-status">Validé</span>
          </div>
          <div className="preview-services">
            <span><i className="preview-service-icon preview-service-a" />Dossier</span>
            <span><i className="preview-service-icon preview-service-b" />Paiement</span>
            <span><i className="preview-service-icon preview-service-c" />Résultats</span>
            <span><i className="preview-service-icon preview-service-d" />Actualités</span>
          </div>
          <div className="preview-next">
            <span className="preview-next-icon">✓</span>
            <span className="preview-next-copy"><small>Prochaine étape</small><strong>Retrait de la bourse</strong></span>
          </div>
        </div>
      </div>
      <span className="preview-float preview-float-cenou"><i /> Dossier validé · notification envoyée</span>
    </div>
  );
}

function ImmoPreview() {
  return (
    <div className="preview preview-immo" aria-hidden="true">
      <div className="preview-window">
        <div className="preview-chrome">
          <span className="preview-dots"><i /><i /><i /></span>
          <span className="preview-url">imomali.com</span>
          <span className="preview-live"><i /> En ligne</span>
        </div>
        <div className="preview-app preview-app-immo">
          <div className="preview-topbar">
            <span className="preview-mark preview-mark-immo">IM</span>
            <span className="preview-brandname">ImoMali</span>
            <span className="preview-search"><i /> Ville, quartier, budget…</span>
            <span className="preview-pill">Publier un bien</span>
          </div>
          <div className="preview-filters">
            <span className="preview-filter preview-filter-active">Tous</span>
            <span className="preview-filter">Maisons</span>
            <span className="preview-filter">Appartements</span>
            <span className="preview-filter">Terrains</span>
          </div>
          <div className="preview-properties">
            <div className="preview-property">
              <span className="preview-property-photo">
                <Image
                  src="/solutions/imomali-villa.webp"
                  alt=""
                  fill
                  unoptimized
                  sizes="170px"
                />
                <span className="preview-property-badge">À vendre</span>
              </span>
              <span className="preview-property-copy">
                <strong>Villa moderne</strong>
                <small>Bamako · 4 pièces</small>
                <span className="preview-property-price">85 000 000 FCFA</span>
              </span>
            </div>
            <div className="preview-property">
              <span className="preview-property-photo">
                <Image
                  src="/solutions/imomali-maison.webp"
                  alt=""
                  fill
                  unoptimized
                  sizes="170px"
                />
                <span className="preview-property-badge preview-property-badge-rent">À louer</span>
              </span>
              <span className="preview-property-copy">
                <strong>Maison familiale</strong>
                <small>Bamako · 3 pièces</small>
                <span className="preview-property-price">350 000 FCFA <i>/ mois</i></span>
              </span>
            </div>
          </div>
          <div className="preview-metrics">
            <span><strong>640+</strong><small>annonces en ligne</small></span>
            <span><strong>120</strong><small>agences partenaires</small></span>
            <span><strong>24 h</strong><small>pour être contacté</small></span>
          </div>
        </div>
      </div>
      <span className="preview-float preview-float-immo"><i /> Nouveau bien publié · Bamako</span>
    </div>
  );
}

export function SolutionPreview({ variant }: { variant: SolutionVariant }) {
  if (variant === "annonces") return <AnnoncesPreview />;
  if (variant === "bataki") return <BatakiPreview />;
  if (variant === "cenou") return <CenouPreview />;
  return <ImmoPreview />;
}
