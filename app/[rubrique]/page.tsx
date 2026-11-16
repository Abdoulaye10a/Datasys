import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { PublicationGrid } from "@/components/publication-grid";
import { SolutionsShowcase } from "@/components/solutions-showcase";
import {
  getPublications,
  sectionNames,
  type Section,
} from "@/lib/content";
import { getSiteSettings } from "@/lib/site-info";

export const instant = false;

const sectionDescriptions: Record<Section, string> = {
  actualites: "Les nouvelles, les idées et les temps forts de DATASYS.",
  activites: "Les rencontres, formations et événements qui font vivre DATASYS.",
  annonces: "Les communiqués et informations officielles de DATASYS.",
  projets: "Découvrez nos solutions numériques pour le recrutement, la communication et les services aux étudiants.",
  galerie: "Quelques images des projets et événements de DATASYS.",
};

const listingHeadings: Record<Section, string> = {
  actualites: "À la une de DATASYS",
  activites: "Nos activités",
  annonces: "Les annonces et informations",
  projets: "Nos réalisations",
  galerie: "Les images de DATASYS",
};

const listingKickers = {
  actualites: "Le fil de l'actualité",
  activites: "Sur le terrain",
  annonces: "Communiqués DATASYS",
  galerie: "Médiathèque",
} satisfies Record<Exclude<Section, "projets">, string>;

const listingDescriptions = {
  actualites:
    "Communiqués, temps forts et prises de parole : suivez ce qui fait avancer DATASYS et ses projets.",
  activites:
    "Ateliers, formations et rencontres : les moments où nos équipes partagent leur expertise et construisent avec leurs partenaires.",
  annonces:
    "Consultez les communiqués et prises de parole officielles de DATASYS, publiés au fil de l'actualité.",
  galerie:
    "Parcourez en images les coulisses, les événements et les réalisations qui marquent la vie de DATASYS.",
} satisfies Record<Exclude<Section, "projets">, string>;

const sectionIndices: Record<Section, string> = {
  actualites: "01",
  activites: "02",
  annonces: "03",
  projets: "04",
  galerie: "05",
};

const sectionOrder: Section[] = [
  "actualites",
  "activites",
  "annonces",
  "projets",
  "galerie",
];

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function isSection(value: string): value is Section {
  return value in sectionNames;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rubrique: string }>;
}): Promise<Metadata> {
  const { rubrique } = await params;
  if (!isSection(rubrique)) return {};
  return {
    title: sectionNames[rubrique],
    description: sectionDescriptions[rubrique],
  };
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ rubrique: string }>;
}) {
  const { rubrique } = await params;
  if (!isSection(rubrique)) notFound();
  await connection();
  const [items, settings] = await Promise.all([
    getPublications(rubrique),
    getSiteSettings(),
  ]);
  const publishedSolutionCount =
    rubrique === "projets"
      ? [
          [settings.solutionAnnoncesVisible, settings.solutionAnnoncesStatus],
          [settings.solutionBatakiVisible, settings.solutionBatakiStatus],
          [settings.solutionCenouVisible, settings.solutionCenouStatus],
          [settings.solutionImmoVisible, settings.solutionImmoStatus],
        ].filter(([visible, status]) => visible === "true" && status === "PUBLISHED").length
      : 0;
  const publicationCount = items.length + publishedSolutionCount;
  const countLabel = rubrique === "projets"
    ? publicationCount === 1 ? "solution en ligne" : "solutions en ligne"
    : publicationCount === 1 ? "publication en ligne" : "publications en ligne";
  const lastUpdated = items.reduce<Date | null>((latest, item) => {
    const value = new Date(item.date);
    if (Number.isNaN(value.getTime())) return latest;
    return !latest || value > latest ? value : latest;
  }, null);
  const lastUpdatedLabel = lastUpdated ? dateFormatter.format(lastUpdated) : "Bientôt";

  return (
    <SiteLayout>
      <section className={`page-hero page-hero-listing page-hero-${rubrique}`}>
        <div className="container page-hero-layout">
          <div className="page-hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-dot" /> DATASYS · Rubrique {sectionIndices[rubrique]}
            </span>
            <h1>{sectionNames[rubrique]}<em>.</em></h1>
            <p>{sectionDescriptions[rubrique]}</p>
            <div className="breadcrumb">
              <Link href="/">Accueil</Link><span>/</span><strong>{sectionNames[rubrique]}</strong>
            </div>
            <div className="page-hero-facts">
              <div className="page-hero-fact">
                <strong>{publicationCount.toString().padStart(2, "0")}</strong>
                <span>{countLabel}</span>
              </div>
              {lastUpdated && (
                <div className="page-hero-fact">
                  <strong className="is-date">{lastUpdatedLabel}</strong>
                  <span>dernière mise à jour</span>
                </div>
              )}
            </div>
          </div>
          <nav className="hub-directory" aria-label="Explorer les rubriques DATASYS">
            <div className="hub-directory-head">
              <span className="hub-directory-kicker">Explorer <i /></span>
              <p>Le fil <em>DATASYS</em></p>
            </div>
            <ol className="hub-directory-list">
              {sectionOrder.map((key) => (
                <li key={key}>
                  <Link
                    href={`/${key}`}
                    className={key === rubrique ? "is-active" : undefined}
                    aria-current={key === rubrique ? "page" : undefined}
                  >
                    <span className="hub-directory-index">{sectionIndices[key]}</span>
                    <span className="hub-directory-label">{sectionNames[key]}</span>
                    <span className="hub-directory-state">
                      {key === rubrique ? <><i />En cours</> : <ArrowUpRight size={15} aria-hidden="true" />}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            <div className="hub-directory-foot">
              <span>05 rubriques</span>
              <span>DATASYS · Bamako</span>
            </div>
          </nav>
        </div>
      </section>
      <section
        className={`section solutions-section listing-section publication-hub publication-hub-${rubrique}`}
        aria-labelledby={rubrique === "projets" ? "solutions-title" : "publications-title"}
      >
        <div className="container">
          {rubrique !== "projets" && (
            <div className="solutions-heading">
              <span className="section-kicker">{listingKickers[rubrique]}</span>
              <h2 id="publications-title">{listingHeadings[rubrique]}<em>.</em></h2>
              <p>{listingDescriptions[rubrique]}</p>
            </div>
          )}
          <PublicationGrid
            items={items}
            section={rubrique}
            numberOffset={rubrique === "projets" ? publishedSolutionCount : 0}
            hideEmptyResults={rubrique === "projets"}
          >
            {rubrique === "projets" && (
              <>
                <SolutionsShowcase settings={settings} />
              </>
            )}
          </PublicationGrid>
        </div>
      </section>
    </SiteLayout>
  );
}
