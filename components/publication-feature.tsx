import { ArrowUpRight, CalendarDays, MapPin, Maximize2 } from "lucide-react";
import { PublicationViewTracker } from "@/components/publication-view-tracker";
import type { PublicationCard, Section } from "@/lib/content";
import type { PublicationType } from "@/prisma/generated/client/client";

const formatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export const publicationSectionLabels: Record<Section, string> = {
  actualites: "Le journal DATASYS",
  activites: "Au cœur de nos actions",
  annonces: "Informations officielles",
  projets: "Nos réalisations",
  galerie: "Médiathèque",
};

export const publicationTypes: Record<Section, PublicationType> = {
  actualites: "ARTICLE",
  activites: "ACTIVITY",
  annonces: "ANNOUNCEMENT",
  projets: "PROJECT",
  galerie: "MEDIA",
};

export function PublicationFeature({
  item,
  section,
  number,
  index = 0,
  lead = false,
  trackViews = true,
  onImageClick,
}: {
  item: PublicationCard;
  section: Section;
  number: string;
  index?: number;
  lead?: boolean;
  trackViews?: boolean;
  onImageClick?: () => void;
}) {
  const visualImage = item.previewImage || item.image;
  const canEnlarge = section === "galerie" && Boolean(visualImage) && Boolean(onImageClick);
  const hasDedicatedProjectPreview = section === "projets" && Boolean(item.previewImage);
  const hasFullContent =
    section !== "galerie" &&
    item.content.trim() !== "" &&
    item.content.trim() !== item.excerpt.trim();
  const isSparse =
    !hasFullContent &&
    !item.excerpt.trim() &&
    !item.informationGroups?.length &&
    !item.audience;

  return (
    <article
      className={`publication-feature publication-feature-${section}${index % 2 ? " publication-feature-alt" : ""}${lead ? " publication-feature-lead" : ""}${isSparse ? " publication-feature-sparse" : ""}`}
      id={item.slug}
      tabIndex={-1}
      style={{ animationDelay: `${Math.min(index, 5) * 55}ms` }}
    >
      <div className="publication-feature-visual">
        {trackViews && (
          <PublicationViewTracker
            publicationType={publicationTypes[section]}
            publicationId={item.id}
          />
        )}
        <div
          className={`publication-feature-media${visualImage ? " has-image" : ` card-art card-art-${index % 4}`}${hasDedicatedProjectPreview ? " has-preview-image" : ""}`}
        >
          {visualImage ? (
            <>
              <img src={visualImage} alt={section === "galerie" ? item.excerpt || item.title : ""} />
              {canEnlarge && (
                <span className="publication-media-zoom" aria-hidden="true">
                  <Maximize2 size={14} /> Agrandir
                </span>
              )}
            </>
          ) : (
            <span className={`image-placeholder placeholder-${index % 4}`} aria-hidden="true">
              <span className="card-art-grid" aria-hidden="true" />
              <span className="card-art-orbit card-art-orbit-one" aria-hidden="true" />
              <span className="card-art-orbit card-art-orbit-two" aria-hidden="true" />
              <span className="placeholder-mark">D</span>
            </span>
          )}
        </div>
        <span className="solution-visual-index" aria-hidden="true">{number}</span>
        <span className="publication-feature-tag">
          {section === "projets"
            ? "APERÇU DE L’INTERFACE"
            : `DATASYS · ${publicationSectionLabels[section]}`}
        </span>
        {canEnlarge && visualImage && (
          <a
            href={visualImage}
            target="_blank"
            rel="noopener noreferrer"
            id={`gallery-open-${item.slug}`}
            className="publication-media-button"
            onClick={(event) => {
              event.preventDefault();
              onImageClick?.();
            }}
            aria-label={`Agrandir l’image : ${item.title}`}
          />
        )}
      </div>
      <div className={`publication-feature-body${isSparse ? " publication-feature-body-sparse" : ""}`}>
        {lead && (
          <span className="publication-feature-flag">
            <i aria-hidden="true" /> À la une
          </span>
        )}
        {section === "projets" && (item.image || item.category) && (
          <div className="publication-project-brand">
            {item.image && (
              <span className="publication-project-logo">
                <img src={item.image} alt={`Logo ${item.title}`} />
              </span>
            )}
            {item.category && <span className="solution-category">{item.category}</span>}
          </div>
        )}
        <div className="publication-feature-meta">
          {section !== "projets" && item.category && <span className="solution-category">{item.category}</span>}
          <span className="card-date">
            <CalendarDays size={14} /> {formatter.format(new Date(item.date))}
            {item.endDate && ` — ${formatter.format(new Date(item.endDate))}`}
          </span>
          {item.location && (
            <span className="card-location"><MapPin size={14} /> {item.location}</span>
          )}
        </div>
        <h3>{item.title}</h3>
        {item.audience && <p className="solution-audience">{item.audience}</p>}
        {section !== "galerie" && item.excerpt.trim() && (
          <div className="publication-feature-summary">
            <span className="solution-label">EN BREF</span>
            <p>{item.excerpt}</p>
          </div>
        )}
        {hasFullContent && (
          <div className="publication-feature-content">
            {item.content.split(/\n{2,}/).filter(Boolean).map((paragraph, paragraphIndex) => (
              <p key={paragraphIndex}>{paragraph}</p>
            ))}
          </div>
        )}
        {item.informationGroups?.length ? (
          <div className="solution-groups">
            {item.informationGroups.map((group) => (
              <div className="solution-group" key={group.title}>
                <h4>{group.title}</h4>
                <ul>{group.items.map((information) => <li key={information}>{information}</li>)}</ul>
              </div>
            ))}
          </div>
        ) : null}
        {section !== "galerie" && item.linkHref && item.linkLabel && (
          <a
            className="solution-feature-link"
            href={item.linkHref}
            target={/^https?:\/\//i.test(item.linkHref) ? "_blank" : undefined}
            rel={/^https?:\/\//i.test(item.linkHref) ? "noopener noreferrer" : undefined}
            aria-label={`${item.linkLabel} : ${item.title}`}
          >
            {item.linkLabel}<ArrowUpRight size={16} />
          </a>
        )}
      </div>
    </article>
  );
}
