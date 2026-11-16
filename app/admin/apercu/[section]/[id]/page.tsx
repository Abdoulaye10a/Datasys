import Link from "next/link";
import { ArrowLeft, ExternalLink, Eye } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { PublicationFeature } from "@/components/publication-feature";
import { SolutionsShowcase } from "@/components/solutions-showcase";
import { requireSession } from "@/lib/auth";
import { getAdminPath } from "@/lib/admin-paths";
import { sectionNames } from "@/lib/content";
import { isProjectSolutionId } from "@/lib/project-solution-view-ids";
import { getSiteSettings } from "@/lib/site-info";
import {
  getPublicationPreview,
  isPublicationSection,
} from "@/lib/publication-preview";

export const instant = false;

export default async function PublicationPreviewPage({
  params,
}: {
  params: Promise<{ section: string; id: string }>;
}) {
  const session = await requireSession();
  const { section, id } = await params;
  if (!isPublicationSection(section)) notFound();

  const solutionId =
    section === "projets" && session.role === "ADMIN" && id.startsWith("solution-")
      ? id.slice("solution-".length)
      : "";
  if (isProjectSolutionId(solutionId)) {
    const selectedSolutionId = solutionId;
    const settings = await getSiteSettings();
    const solutionStatusKeys = {
      annonces: "solutionAnnoncesStatus",
      bataki: "solutionBatakiStatus",
      cenou: "solutionCenouStatus",
      immo: "solutionImmoStatus",
    } as const;
    const published =
      settings[solutionStatusKeys[selectedSolutionId]] === "PUBLISHED";
    const title = {
      annonces: settings.solutionAnnoncesName,
      bataki: settings.solutionBatakiName,
      cenou: settings.solutionCenouName,
      immo: settings.solutionImmoName,
    }[selectedSolutionId];

    return (
      <AdminShell user={session}>
        <div className="admin-page-heading">
          <div>
            <Link
              className="admin-back"
              href={getAdminPath(`/admin/projets?editSolution=${selectedSolutionId}`, session.role)}
            >
              <ArrowLeft size={14} /> Modifier la solution
            </Link>
            <span className="section-kicker">
              <Eye size={15} /> APERÇU · PROJETS
            </span>
            <h1>Aperçu : {title}</h1>
            <p>Le panneau tel qu’il apparaît sur le site public.</p>
          </div>
          <span className={`status-pill ${published ? "published" : "draft"}`}>
            {published ? "En ligne" : "Brouillon"}
          </span>
        </div>

        <div className="admin-preview-notice">
          <span className="admin-preview-notice-icon" aria-hidden="true">
            <Eye size={18} />
          </span>
          <div>
            <strong>
              {published
                ? "Cette publication est en ligne."
                : "Aperçu privé : cette publication n’est pas encore visible du public."}
            </strong>
            <p>
              {published
                ? "L’aperçu est identique à la version affichée sur le site."
                : "Vous pouvez vérifier le rendu avant de passer le statut en « Publié »."}
            </p>
          </div>
          {published && (
            <Link
              className="admin-preview-link"
              href="/projets"
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir sur le site <ExternalLink size={15} />
            </Link>
          )}
        </div>

        <section className="admin-preview-stage" aria-label="Aperçu de la publication">
          <SolutionsShowcase
            settings={settings}
            previewSolutionId={selectedSolutionId}
            previewUnpublished
            trackViews={false}
          />
        </section>

        <p className="field-hint admin-preview-hint">
          L’aperçu reflète la dernière version enregistrée. Les modifications en cours de
          saisie n’apparaissent pas encore.
        </p>
      </AdminShell>
    );
  }

  const preview = await getPublicationPreview(section, id, session);
  if (!preview) notFound();

  const isGallery = section === "galerie";
  const backHref = isGallery
    ? "/admin/galerie"
    : `/admin/${section}?edit=${id}`;
  const publicHref = `/${section}#${preview.card.slug}`;

  return (
    <AdminShell user={session}>
      <div className="admin-page-heading">
        <div>
          <Link className="admin-back" href={getAdminPath(backHref, session.role)}>
            <ArrowLeft size={14} /> {isGallery ? "Retour à la galerie" : "Modifier la publication"}
          </Link>
          <span className="section-kicker">
            <Eye size={15} /> APERÇU · {sectionNames[section].toUpperCase()}
          </span>
          <h1>Aperçu de la publication</h1>
          <p>Le panneau tel qu’il apparaît sur le site public.</p>
        </div>
        <span className={`status-pill ${preview.published ? "published" : "draft"}`}>
          {preview.published ? "En ligne" : "Brouillon"}
        </span>
      </div>

      <div className="admin-preview-notice">
        <span className="admin-preview-notice-icon" aria-hidden="true">
          <Eye size={18} />
        </span>
        <div>
          <strong>
            {preview.published
              ? "Cette publication est en ligne."
              : "Aperçu privé : cette publication n’est pas encore visible du public."}
          </strong>
          <p>
            {preview.published
              ? "L’aperçu est identique à la version affichée sur le site."
              : "Vous pouvez vérifier le rendu avant de passer le statut en « Publié »."}
          </p>
        </div>
        {preview.published && (
          <Link
            className="admin-preview-link"
            href={publicHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            Voir sur le site <ExternalLink size={15} />
          </Link>
        )}
      </div>

      <section className="admin-preview-stage" aria-label="Aperçu de la publication">
        <div className="publication-grid publication-feature-list admin-preview-list">
          <PublicationFeature
            item={preview.card}
            section={section}
            number="01"
            index={0}
            trackViews={false}
          />
        </div>
      </section>

      <p className="field-hint admin-preview-hint">
        L’aperçu reflète la dernière version enregistrée. Les modifications en cours de
        saisie n’apparaissent pas encore.
      </p>
    </AdminShell>
  );
}
