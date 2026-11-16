import Link from "next/link";
import { ArrowLeft, ContactRound, ImagePlus, LayoutTemplate, Newspaper, Palette, Save, SlidersHorizontal, Sparkles } from "lucide-react";
import { updateSiteSettingsAction } from "@/app/admin/actions";
import { AdminLogoPicker } from "@/components/admin-logo-picker";
import { AdminSiteLocationPicker } from "@/components/admin-site-location-picker";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminPath } from "@/lib/admin-paths";
import { getSiteSettings } from "@/lib/site-info";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function PersonalizationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await requireAdmin();
  const [{ saved }, settings, media] = await Promise.all([
    searchParams,
    getSiteSettings(),
    prisma.media.findMany({
      where: { type: "image" },
      select: { id: true, url: true, altText: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const homepageSections = [
    { label: "Journal / actualités", visible: "homeShowNews", order: "homeNewsOrder" },
    { label: "Notre approche", visible: "homeShowApproach", order: "homeApproachOrder" },
    { label: "Activités", visible: "homeShowActivities", order: "homeActivitiesOrder" },
    { label: "Appel à l’action", visible: "homeShowCta", order: "homeCtaOrder" },
  ] as const;

  return (
    <AdminShell user={session}>
      <div className="admin-page-heading">
        <div>
          <Link className="admin-back" href={getAdminPath("/admin", session.role)}><ArrowLeft size={14} /> Tableau de bord</Link>
          <span className="section-kicker"><SlidersHorizontal size={15} /> APPARENCE ET IDENTITÉ</span>
          <h1>Personnalisation du site</h1>
          <p>Adaptez l’identité, les couleurs, l’accueil et les coordonnées publiques.</p>
        </div>
        <Link className="admin-panel-link" href="/" target="_blank" rel="noreferrer">Voir le site public</Link>
      </div>

      {saved && (
        <p className="admin-success" role="status">
          {saved === "logo"
            ? "Le logo a été mis à jour sur le site."
            : "Les personnalisations ont été enregistrées et appliquées au site."}
        </p>
      )}

      <div className="settings-toolbar">
        <nav className="settings-section-nav" aria-label="Sections de la personnalisation">
          <a href="#identite">Identité</a>
          <a href="#theme">Thème</a>
          <a href="#accueil">Accueil</a>
          <a href="#presentation">Qui sommes-nous</a>
          <a href="#actualites">Actualités</a>
          <a href="#organisation">Organisation</a>
          <a href="#coordonnees">Coordonnées</a>
        </nav>
        <button className="settings-save-button" type="submit" form="settings-form"><Save size={15} /><span>Enregistrer</span></button>
      </div>

      <form id="settings-form" className="site-settings-form" action={updateSiteSettingsAction} encType="multipart/form-data">
        <section className="admin-panel" id="identite">
          <div className="admin-panel-heading">
            <div><span className="section-kicker"><Palette size={14} /> IDENTITÉ VISUELLE</span><h2><ImagePlus size={19} /> Logo et arrière-plans</h2></div>
            <Palette size={20} />
          </div>
          <AdminLogoPicker currentLogoUrl={settings.logoUrl} media={media} />
          <div className="site-color-grid">
            <label>Bleu nuit<input type="color" name="primaryColor" defaultValue={settings.primaryColor} /><small className="field-hint">Boutons, titres et liens.</small></label>
            <label>Fond bleu nuit<input type="color" name="deepColor" defaultValue={settings.deepColor} /><small className="field-hint">Bannières et arrière-plans foncés.</small></label>
          </div>
        </section>

        <section className="admin-panel site-theme-panel" id="theme">
          <div className="admin-panel-heading">
            <div><span className="section-kicker"><Palette size={14} /> THÈME DU SITE</span><h2><Sparkles size={19} /> Thème DATASYS</h2></div>
            <Palette size={20} />
          </div>
          <div className="logo-color-group">
            <p>Le thème DATASYS conserve uniquement le rouge comme couleur d’accent. Les arrière-plans bleu nuit se règlent séparément ci-dessus.</p>
            <div className="site-theme-swatches" aria-label="Aperçu de la couleur rouge du thème DATASYS">
              <span style={{ backgroundColor: settings.accentColor }}>Rouge DATASYS</span>
            </div>
            <div className="site-color-grid">
              <label>Couleur d’accent rouge<input type="color" name="accentColor" defaultValue={settings.accentColor} /></label>
            </div>
          </div>
        </section>

        <section className="admin-panel" id="accueil">
          <div className="admin-panel-heading">
            <div><span className="section-kicker"><LayoutTemplate size={14} /> PAGE D’ACCUEIL</span><h2><Sparkles size={19} /> Message principal</h2></div>
            <SlidersHorizontal size={20} />
          </div>
          <div className="site-settings-grid">
            <label>Petit texte au-dessus du titre<input name="homeEyebrow" required maxLength={100} defaultValue={settings.homeEyebrow} /></label>
            <label>Image de fond
              <select name="homeHeroImageUrl" defaultValue={settings.homeHeroImageUrl}>
                <option value="">Aucune image (fond graphique actuel)</option>
                {media.map((item) => <option key={item.id} value={item.url}>{item.altText || item.url}</option>)}
              </select>
              <small className="field-hint">Sélectionnez une image déjà importée.</small>
            </label>
            <label>Première ligne du titre<input name="homeTitleFirst" required maxLength={80} defaultValue={settings.homeTitleFirst} /></label>
            <label>Deuxième ligne avant le mot en accent<input name="homeTitleBridge" required maxLength={80} defaultValue={settings.homeTitleBridge} /></label>
            <label>Mot mis en évidence<input name="homeTitleEmphasis" required maxLength={80} defaultValue={settings.homeTitleEmphasis} /></label>
            <label>Dernière ligne du titre<input name="homeTitleLast" required maxLength={80} defaultValue={settings.homeTitleLast} /></label>
            <label className="site-settings-wide">Texte de présentation<textarea name="homeDescription" required minLength={10} maxLength={500} rows={3} defaultValue={settings.homeDescription} /></label>
          </div>
          <div className="site-settings-grid">
            <label>Texte du bouton principal<input name="homePrimaryLabel" required maxLength={80} defaultValue={settings.homePrimaryLabel} /></label>
            <label>Destination du bouton principal<input name="homePrimaryHref" type="text" required maxLength={2048} defaultValue={settings.homePrimaryHref} /><small className="field-hint">Lien interne (ex. /projets) ou adresse HTTPS.</small></label>
            <label>Texte du lien secondaire<input name="homeSecondaryLabel" required maxLength={80} defaultValue={settings.homeSecondaryLabel} /></label>
            <label>Destination du lien secondaire<input name="homeSecondaryHref" type="text" required maxLength={2048} defaultValue={settings.homeSecondaryHref} /><small className="field-hint">Lien interne (ex. /actualites) ou adresse HTTPS.</small></label>
          </div>
        </section>

        <section className="admin-panel" id="presentation">
          <div className="admin-panel-heading"><div><span className="section-kicker"><ContactRound size={14} /> PRÉSENTATION</span><h2><ContactRound size={19} /> Section « Qui sommes-nous »</h2></div></div>
          <div className="site-settings-grid">
            <label>Petit titre de section<input name="homeIntroKicker" required maxLength={100} defaultValue={settings.homeIntroKicker} /></label>
            <label>Titre principal<input name="homeIntroTitle" required maxLength={180} defaultValue={settings.homeIntroTitle} /></label>
            <label className="site-settings-wide">Texte de présentation<textarea name="homeIntroText" required minLength={10} maxLength={600} rows={4} defaultValue={settings.homeIntroText} /></label>
          </div>
        </section>

        <section className="admin-panel" id="actualites">
          <div className="admin-panel-heading"><div><span className="section-kicker"><Newspaper size={14} /> ACTUALITÉS</span><h2><Newspaper size={19} /> Section « Ce qui nous anime »</h2></div></div>
          <div className="site-settings-grid">
            <label>Petit titre de section<input name="homeNewsKicker" required maxLength={100} defaultValue={settings.homeNewsKicker} /></label>
            <label>Début du titre<input name="homeNewsTitleLead" required maxLength={80} defaultValue={settings.homeNewsTitleLead} /></label>
            <label>Fin du titre (mise en évidence)<input name="homeNewsTitleAccent" required maxLength={80} defaultValue={settings.homeNewsTitleAccent} /></label>
            <label>Texte du lien « Toutes les actualités »<input name="homeNewsAllLabel" required maxLength={80} defaultValue={settings.homeNewsAllLabel} /></label>
            <label>Titre de l’actualité à la une<input name="homeNewsFeaturedTitle" maxLength={180} defaultValue={settings.homeNewsFeaturedTitle} /><small className="field-hint">Laissez vide pour reprendre le titre de la dernière actualité.</small></label>
            <label className="site-settings-wide">Description de l’actualité à la une<textarea name="homeNewsFeaturedText" maxLength={500} rows={3} defaultValue={settings.homeNewsFeaturedText} /><small className="field-hint">Laissez vide pour reprendre son extrait.</small></label>
            <label>Texte du lien de l’actualité à la une<input name="homeNewsFeaturedLabel" required maxLength={80} defaultValue={settings.homeNewsFeaturedLabel} /></label>
            <label>Badge de l’actualité à la une<input name="homeNewsFeaturedBadge" required maxLength={50} defaultValue={settings.homeNewsFeaturedBadge} /></label>
            <label>Texte « Explorer le journal »<input name="homeNewsExploreLabel" required maxLength={80} defaultValue={settings.homeNewsExploreLabel} /></label>
            <label>Titre affiché sans actualité<input name="homeNewsEmptyTitle" required maxLength={120} defaultValue={settings.homeNewsEmptyTitle} /></label>
            <label className="site-settings-wide">Texte affiché sans actualité<textarea name="homeNewsEmptyText" required minLength={10} maxLength={300} rows={3} defaultValue={settings.homeNewsEmptyText} /></label>
          </div>
        </section>

        <section className="admin-panel" id="organisation">
          <div className="admin-panel-heading"><div><span className="section-kicker"><LayoutTemplate size={14} /> ORGANISATION DE L’ACCUEIL</span><h2><SlidersHorizontal size={19} /> Ordre et visibilité des sections</h2></div></div>
          <p className="field-hint">Choisissez une position différente pour chaque section visible. L’introduction « Qui sommes-nous » reste juste sous la bannière.</p>
          <div className="home-section-settings">
            {homepageSections.map((section) => (
              <div className="home-section-setting" key={section.visible}>
                <strong><Sparkles size={15} /> {section.label}</strong>
                <label>Affichage<select name={section.visible} defaultValue={settings[section.visible]}><option value="true">Afficher</option><option value="false">Masquer</option></select></label>
                <label>Position<select name={section.order} defaultValue={settings[section.order]}>{[1, 2, 3, 4].map((position) => <option key={position} value={position}>{position}</option>)}</select></label>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel" id="coordonnees">
          <div className="admin-panel-heading"><div><span className="section-kicker"><ContactRound size={14} /> COORDONNÉES PUBLIQUES</span><h2><ContactRound size={19} /> Contact et réseaux sociaux</h2></div></div>
          <div className="site-settings-grid">
            <label>Nom officiel<input name="legalName" required maxLength={120} defaultValue={settings.legalName} /></label>
            <label>Adresse<input name="location" maxLength={160} defaultValue={settings.location} /></label>
            <AdminSiteLocationPicker latitude={settings.locationLatitude} longitude={settings.locationLongitude} />
            <label>E-mail de contact<input name="contactEmail" type="email" maxLength={254} defaultValue={settings.contactEmail} /></label>
            <label>Téléphone principal<input name="phonePrimary" type="tel" maxLength={30} defaultValue={settings.phonePrimary} /></label>
            <label>Téléphone secondaire<input name="phoneSecondary" type="tel" maxLength={30} defaultValue={settings.phoneSecondary} /></label>
            <label>Page LinkedIn<input name="linkedinUrl" type="url" maxLength={2048} defaultValue={settings.linkedinUrl} /></label>
            <label>Page Instagram<input name="instagramUrl" type="url" maxLength={2048} defaultValue={settings.instagramUrl} /></label>
            <label>RCCM<input name="registration" maxLength={80} defaultValue={settings.registration} /></label>
            <label>NIF<input name="taxNumber" maxLength={80} defaultValue={settings.taxNumber} /></label>
            <label>Compte bancaire (BNDA)<input name="bankAccount" maxLength={100} defaultValue={settings.bankAccount} /></label>
          </div>
        </section>

        <div className="site-settings-submit settings-savebar">
          <span className="settings-savebar-note"><Save size={15} /> Les modifications s’appliquent à tout le site public.</span>
          <div>
            <Link className="button button-light" href={getAdminPath("/admin", session.role)}>Annuler</Link>
            <button className="button button-primary" type="submit"><Save size={16} /> Enregistrer</button>
          </div>
        </div>
        <p className="field-hint"><ImagePlus size={13} /> Les personnalisations enregistrées sont appliquées sur l’ensemble du site public.</p>
      </form>
    </AdminShell>
  );
}
