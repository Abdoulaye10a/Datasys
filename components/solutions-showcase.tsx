import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { PublicationViewTracker } from "@/components/publication-view-tracker";
import { SolutionPreview, type SolutionVariant } from "@/components/solution-preview";
import { projectSolutionViewIds, type ProjectSolutionId } from "@/lib/project-solution-view-ids";
import type { SiteSettings } from "@/lib/site-info";

function splitItems(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

export function SolutionsShowcase({
  settings,
  previewSolutionId,
  previewUnpublished = false,
  trackViews = true,
}: {
  settings: SiteSettings;
  previewSolutionId?: ProjectSolutionId;
  previewUnpublished?: boolean;
  trackViews?: boolean;
}) {
  const solutions: {
    variant: SolutionVariant;
    viewId: string;
    visible: boolean;
    name: string;
    image: string;
    imageAlt: string;
    previewImage: string;
    category: string;
    audience: string;
    description: string;
    groups: { title: string; items: string[] }[];
    href: string;
    linkLabel: string;
  }[] = [
    {
      variant: "annonces",
      viewId: projectSolutionViewIds.annonces,
      visible: settings.solutionAnnoncesVisible === "true" && settings.solutionAnnoncesStatus === "PUBLISHED",
      name: settings.solutionAnnoncesName,
      image: settings.solutionAnnoncesImage,
      imageAlt: `Logo ${settings.solutionAnnoncesName}`,
      previewImage: settings.solutionAnnoncesPreviewImage,
      category: settings.solutionAnnoncesCategory,
      audience: settings.solutionAnnoncesAudience,
      description: settings.solutionAnnoncesDescription,
      groups: [
        {
          title: settings.solutionAnnoncesRecruiterTitle,
          items: splitItems(settings.solutionAnnoncesRecruiterItems),
        },
        {
          title: settings.solutionAnnoncesCandidateTitle,
          items: splitItems(settings.solutionAnnoncesCandidateItems),
        },
      ],
      href: settings.solutionAnnoncesHref,
      linkLabel: settings.solutionAnnoncesLinkLabel,
    },
    {
      variant: "bataki",
      viewId: projectSolutionViewIds.bataki,
      visible: settings.solutionBatakiVisible === "true" && settings.solutionBatakiStatus === "PUBLISHED",
      name: settings.solutionBatakiName,
      image: settings.solutionBatakiImage,
      imageAlt: `Logo ${settings.solutionBatakiName}`,
      previewImage: settings.solutionBatakiPreviewImage,
      category: settings.solutionBatakiCategory,
      audience: settings.solutionBatakiAudience,
      description: settings.solutionBatakiDescription,
      groups: [
        {
          title: settings.solutionBatakiFeaturesTitle,
          items: splitItems(settings.solutionBatakiFeatures),
        },
      ],
      href: settings.solutionBatakiHref,
      linkLabel: settings.solutionBatakiLinkLabel,
    },
    {
      variant: "cenou",
      viewId: projectSolutionViewIds.cenou,
      visible: settings.solutionCenouVisible === "true" && settings.solutionCenouStatus === "PUBLISHED",
      name: settings.solutionCenouName,
      image: settings.solutionCenouImage,
      imageAlt: `Logo ${settings.solutionCenouName}`,
      previewImage: settings.solutionCenouPreviewImage,
      category: settings.solutionCenouCategory,
      audience: settings.solutionCenouAudience,
      description: settings.solutionCenouDescription,
      groups: [
        {
          title: settings.solutionCenouStudentTitle,
          items: splitItems(settings.solutionCenouStudentItems),
        },
        {
          title: settings.solutionCenouAdministrationTitle,
          items: splitItems(settings.solutionCenouAdministrationItems),
        },
      ],
      href: settings.solutionCenouHref,
      linkLabel: settings.solutionCenouLinkLabel,
    },
    {
      variant: "immo",
      viewId: projectSolutionViewIds.immo,
      visible: settings.solutionImmoVisible === "true" && settings.solutionImmoStatus === "PUBLISHED",
      name: settings.solutionImmoName,
      image: settings.solutionImmoImage,
      imageAlt: `Logo ${settings.solutionImmoName}`,
      previewImage: settings.solutionImmoPreviewImage,
      category: settings.solutionImmoCategory,
      audience: settings.solutionImmoAudience,
      description: settings.solutionImmoDescription,
      groups: [
        {
          title: settings.solutionImmoFirstGroupTitle,
          items: splitItems(settings.solutionImmoFirstGroupItems),
        },
        {
          title: settings.solutionImmoSecondGroupTitle,
          items: splitItems(settings.solutionImmoSecondGroupItems),
        },
      ],
      href: settings.solutionImmoHref,
      linkLabel: settings.solutionImmoLinkLabel,
    },
  ];

  const visibleSolutions = previewSolutionId
    ? solutions.filter(
        (solution) =>
          solution.variant === previewSolutionId &&
          (previewUnpublished || solution.visible),
      )
    : solutions.filter((solution) => solution.visible);

  return (
    <>
      <div className="solutions-heading">
        <span className="section-kicker">{settings.solutionsKicker}</span>
        <h2 id="solutions-title">{settings.solutionsTitle}<em>.</em></h2>
        <p>{settings.solutionsDescription}</p>
      </div>
      <div className="solutions-showcase">
        {visibleSolutions.map((solution, index) => {
          const featureIndex = previewSolutionId
            ? solutions.findIndex((item) => item.variant === solution.variant)
            : index;
          const isExternal = /^https?:\/\//i.test(solution.href);
          const linkContent = <>{solution.linkLabel} <ArrowUpRight size={16} /></>;
          return (
            <article
              className={`solution-feature solution-feature-${solution.variant}${featureIndex % 2 ? " solution-feature-alt" : ""}`}
              key={solution.variant}
            >
              <div className="solution-visual">
                {trackViews && (
                  <PublicationViewTracker
                    publicationType="PROJECT"
                    publicationId={solution.viewId}
                  />
                )}
                <SolutionPreview variant={solution.variant} />
                {solution.previewImage && (
                  <span className="solution-visual-photo" aria-hidden="true">
                    <Image
                      src={solution.previewImage}
                      alt=""
                      fill
                      unoptimized
                      sizes="(max-width: 1000px) 100vw, 52vw"
                    />
                  </span>
                )}
                <span className="solution-visual-index">0{featureIndex + 1}</span>
                <span className="solution-visual-note">Aperçu de l’interface</span>
              </div>
              <div className="solution-body">
                <div className="solution-brand-row">
                  <span className="solution-brand-logo">
                    <Image
                      src={solution.image}
                      alt={solution.imageAlt}
                      fill
                      unoptimized
                      sizes="56px"
                    />
                  </span>
                  <span className="solution-category">{solution.category}</span>
                </div>
                <h3>{solution.name}</h3>
                <p className="solution-audience">{solution.audience}</p>
                <p className="solution-description">{solution.description}</p>
                <div className="solution-groups">
                  {solution.groups.map((group) => (
                    <div className="solution-group" key={group.title}>
                      <h4>{group.title}</h4>
                      <ul>
                        {group.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {isExternal ? (
                  <a
                    className="solution-feature-link"
                    href={solution.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {linkContent}
                  </a>
                ) : (
                  <Link className="solution-feature-link" href={solution.href}>
                    {linkContent}
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
