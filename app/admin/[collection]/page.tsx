import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, Eye, FileText, FolderKanban, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { AdminActionButtonFields } from "@/components/admin-action-button-fields";
import {
  AdminProjectSolutionsEditor,
  getProjectSolutionName,
} from "@/components/admin-project-solutions-editor";
import { PublicationViewBadge } from "@/components/publication-view-badge";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import {
  createContentAction,
  deleteContentAction,
  deleteProjectSolutionAction,
} from "@/app/admin/actions";
import { requireSession } from "@/lib/auth";
import { getAdminPath } from "@/lib/admin-paths";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-info";
import { getPublicationViewCounts } from "@/lib/publication-views";
import {
  projectSolutionViewIds,
  type ProjectSolutionId,
} from "@/lib/project-solution-view-ids";

export const instant = false;

const collections = {
  activites: { title: "Activités", intro: "Organisez et publiez vos événements et formations.", kind: "activites" },
  annonces: { title: "Annonces", intro: "Diffusez les informations officielles de DATASYS.", kind: "annonces" },
  projets: { title: "Projets", intro: "Présentez vos réalisations et solutions numériques.", kind: "projets" },
} as const;

type Collection = keyof typeof collections;

function isCollection(value: string): value is Collection {
  return value in collections;
}

export default async function AdminCollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string }>;
  searchParams: Promise<{
    created?: string;
    updated?: string;
    solutionUpdated?: string;
    solutionDeleted?: string;
    edit?: string;
    editSolution?: string;
  }>;
}) {
  const { collection } = await params;
  if (!isCollection(collection)) notFound();
  const session = await requireSession();
  const [{ created, updated, solutionUpdated, solutionDeleted, edit, editSolution }, items] = await Promise.all([
    searchParams,
    collection === "activites"
      ? prisma.activity.findMany({
          where: session.role === "ADMIN" ? {} : { authorId: session.userId },
          orderBy: { startDate: "desc" },
        })
      : collection === "annonces"
        ? prisma.announcement.findMany({
            where: session.role === "ADMIN" ? {} : { authorId: session.userId },
            orderBy: { updatedAt: "desc" },
          })
        : prisma.project.findMany({
            where: session.role === "ADMIN" ? {} : { authorId: session.userId },
            orderBy: { updatedAt: "desc" },
          }),
  ]);
  const solutionEditorData =
    collection === "projets" && session.role === "ADMIN"
      ? await Promise.all([
          getSiteSettings(),
          prisma.media.findMany({
            where: { type: "image" },
            select: { id: true, url: true, altText: true },
            orderBy: { createdAt: "desc" },
          }),
        ]).then(([settings, media]) => ({ settings, media }))
      : null;
  const solutionIds: ProjectSolutionId[] = ["annonces", "bataki", "cenou", "immo"];
  const solutionVisibilityKeys = {
    annonces: "solutionAnnoncesVisible",
    bataki: "solutionBatakiVisible",
    cenou: "solutionCenouVisible",
    immo: "solutionImmoVisible",
  } as const;
  const solutionDateKeys = {
    annonces: "solutionAnnoncesDate",
    bataki: "solutionBatakiDate",
    cenou: "solutionCenouDate",
    immo: "solutionImmoDate",
  } as const;
  const solutionStatusKeys = {
    annonces: "solutionAnnoncesStatus",
    bataki: "solutionBatakiStatus",
    cenou: "solutionCenouStatus",
    immo: "solutionImmoStatus",
  } as const;
  const visibleSolutionIds = solutionEditorData
    ? solutionIds.filter((id) => solutionEditorData.settings[solutionVisibilityKeys[id]] === "true")
    : [];
  const selectedSolutionId =
    solutionEditorData && solutionIds.some((id) => id === editSolution)
      ? (editSolution as ProjectSolutionId)
      : undefined;
    const publicationType =
      collection === "activites"
        ? "ACTIVITY"
        : collection === "annonces"
          ? "ANNOUNCEMENT"
          : "PROJECT";
    const viewCounts = await getPublicationViewCounts(
      publicationType,
      collection === "projets" && session.role === "ADMIN"
        ? [...items.map(({ id }) => id), ...Object.values(projectSolutionViewIds)]
        : items.map(({ id }) => id),
    );
  const config = collections[collection];
  const CollectionIcon =
    collection === "activites"
      ? CalendarDays
      : collection === "annonces"
        ? FileText
        : FolderKanban;
  const itemToEdit = selectedSolutionId
    ? undefined
    : edit
      ? items.find((item) => item.id === edit)
      : undefined;
  const editedDescription = itemToEdit
    ? "content" in itemToEdit
      ? itemToEdit.content
      : itemToEdit.description
    : "";
  const editedExcerpt =
    itemToEdit && "excerpt" in itemToEdit ? itemToEdit.excerpt ?? "" : "";
  const editedProjectDate =
    itemToEdit && "projectDate" in itemToEdit && itemToEdit.projectDate
      ? itemToEdit.projectDate.toISOString().slice(0, 10)
      : "";
  const editedImage =
    itemToEdit && "image" in itemToEdit ? itemToEdit.image ?? "" : "";
  const editedPreviewImage =
    itemToEdit && "previewImage" in itemToEdit
      ? itemToEdit.previewImage ?? ""
      : "";
  const editedLinkHref =
    itemToEdit && "linkHref" in itemToEdit ? itemToEdit.linkHref ?? "" : "";
  const editedLinkLabel =
    itemToEdit && "linkLabel" in itemToEdit ? itemToEdit.linkLabel ?? "" : "";
  const editedLocation =
    itemToEdit && "location" in itemToEdit ? itemToEdit.location : "";
  const editedStartDate =
    itemToEdit && "startDate" in itemToEdit
      ? toLocalDateTime(itemToEdit.startDate)
      : "";
  const editedEndDate =
    itemToEdit && "endDate" in itemToEdit && itemToEdit.endDate
      ? toLocalDateTime(itemToEdit.endDate)
      : "";
  const editedExpiration =
    itemToEdit && "expiresAt" in itemToEdit && itemToEdit.expiresAt
      ? formatExpirationDate(itemToEdit.expiresAt)
      : "";
  const editedPublicationStatus =
    itemToEdit && "publicationStatus" in itemToEdit
      ? itemToEdit.publicationStatus
      : undefined;
  const editedStatus =
    itemToEdit?.status ??
    (collection === "annonces" ? "PUBLISHED" : "DRAFT");
  const previewImageField = (
    <>
      <label>Image d’aperçu<input name="previewImageFile" type="file" accept="image/jpeg,image/png,image/webp" /></label>
      <small className="field-hint">
        Ajoutez une capture de l’interface pour le grand panneau. Le logo reste affiché séparément près du titre. Sans aperçu, le logo est affiché sans être recadré.
        {editedPreviewImage ? " L’aperçu actuel sera conservé si vous n’en choisissez pas un autre." : ""}
      </small>
      {itemToEdit && editedPreviewImage && <label className="image-remove-option"><input type="checkbox" name="removePreviewImage" /> Supprimer l’image d’aperçu actuelle</label>}
    </>
  );

  return (
    <AdminShell user={session}>
      <div className="admin-page-heading">
        <div><Link className="admin-back" href={getAdminPath("/admin", session.role)}><ArrowLeft size={14} /> Tableau de bord</Link><span className="section-kicker"><CollectionIcon size={15} /> PUBLICATIONS</span><h1>{config.title}</h1><p>{config.intro}</p></div>
        <span className="admin-count">{items.length + visibleSolutionIds.length} publication{items.length + visibleSolutionIds.length === 1 ? "" : "s"}</span>
      </div>
      {(created || updated || solutionUpdated || solutionDeleted) && <p className="admin-success" role="status">{solutionDeleted ? "La solution a bien été supprimée." : solutionUpdated ? "La fiche de solution a bien été modifiée." : updated ? "Votre publication a bien été modifiée." : "Votre publication a bien été enregistrée."}</p>}
      <div className="admin-editor-layout">
        <section className="admin-panel editor-panel">
          <div className="admin-panel-heading"><div><span className="section-kicker">{selectedSolutionId || itemToEdit ? <Pencil size={14} /> : <Plus size={14} />}{selectedSolutionId || itemToEdit ? "MODIFICATION" : "NOUVELLE PUBLICATION"}</span><h2><CollectionIcon size={19} /> {selectedSolutionId && solutionEditorData ? `Modifier ${getProjectSolutionName(selectedSolutionId, solutionEditorData.settings)}` : itemToEdit ? "Modifier la publication" : `Ajouter ${collection === "activites" ? "une activité" : collection === "annonces" ? "une annonce" : "un projet"}`}</h2></div><div className="admin-heading-actions"><CollectionIcon size={20} className="admin-heading-icon" />{!(selectedSolutionId && solutionEditorData) && <button className="admin-heading-save" type="submit" form="collection-form"><Save size={15} /><span>Enregistrer</span></button>}</div></div>
          {selectedSolutionId && solutionEditorData ? (
            <AdminProjectSolutionsEditor
              solutionId={selectedSolutionId}
              settings={solutionEditorData.settings}
            />
          ) : (
            <form id="collection-form" className="admin-form" action={createContentAction}>
              <input type="hidden" name="kind" value={collection} />
              {itemToEdit && <input type="hidden" name="id" value={itemToEdit.id} />}
              {collection === "projets" ? (
                <>
                  <fieldset className="admin-form-section">
                    <legend><span className="admin-form-step">1</span> Présentation du projet</legend>
                    <label>Nom du projet<input name="title" required minLength={1} maxLength={140} defaultValue={itemToEdit?.title} /></label>
                    <div className="admin-form-row">
                      <label>Catégorie<input name="category" maxLength={100} defaultValue={itemToEdit && "category" in itemToEdit ? itemToEdit.category ?? "" : ""} /></label>
                      <label>Public concerné<input name="audience" maxLength={180} defaultValue={itemToEdit && "audience" in itemToEdit ? itemToEdit.audience ?? "" : ""} /></label>
                    </div>
                    <label>Présentation<textarea name="description" maxLength={20000} rows={5} defaultValue={editedDescription} /></label>
                  </fieldset>
                  <fieldset className="admin-form-section">
                    <legend><span className="admin-form-step">2</span> Informations complémentaires</legend>
                    <fieldset className="solution-admin-group">
                      <legend>Premier groupe d’informations</legend>
                      <label>Titre affiché<input name="firstGroupTitle" maxLength={100} defaultValue={itemToEdit && "firstGroupTitle" in itemToEdit ? itemToEdit.firstGroupTitle ?? "" : ""} /></label>
                      <label>Informations (une par ligne)<textarea name="firstGroupItems" maxLength={1600} rows={5} defaultValue={itemToEdit && "firstGroupItems" in itemToEdit ? itemToEdit.firstGroupItems ?? "" : ""} /></label>
                    </fieldset>
                    <fieldset className="solution-admin-group">
                      <legend>Deuxième groupe d’informations (facultatif)</legend>
                      <label>Titre affiché<input name="secondGroupTitle" maxLength={100} defaultValue={itemToEdit && "secondGroupTitle" in itemToEdit ? itemToEdit.secondGroupTitle ?? "" : ""} /></label>
                      <label>Informations (une par ligne)<textarea name="secondGroupItems" maxLength={1200} rows={5} defaultValue={itemToEdit && "secondGroupItems" in itemToEdit ? itemToEdit.secondGroupItems ?? "" : ""} /></label>
                    </fieldset>
                  </fieldset>
                  <fieldset className="admin-form-section">
                    <legend><span className="admin-form-step">3</span> Images</legend>
                    <label>Logo<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" /></label>
                    <small className="field-hint">JPEG, PNG ou WebP, 4 Mo maximum.{editedImage ? " Le logo actuel sera conservé si vous n’en choisissez pas un autre." : ""}</small>
                    {itemToEdit && editedImage && <label className="image-remove-option"><input type="checkbox" name="removeImage" /> Supprimer le logo actuel</label>}
                    {previewImageField}
                  </fieldset>
                  <fieldset className="admin-form-section">
                    <legend><span className="admin-form-step">4</span> Publication</legend>
                    <div className="admin-form-row">
                      <label>Date du projet<input name="projectDate" type="date" defaultValue={editedProjectDate} /></label>
                      <label>Statut<select name="status" defaultValue={editedStatus}><option value="DRAFT">Brouillon</option><option value="PUBLISHED">Publié</option></select></label>
                    </div>
                  </fieldset>
                </>
              ) : (
                <>
                  <fieldset className="admin-form-section">
                    <legend><span className="admin-form-step">1</span> Contenu</legend>
                    <label>Titre<input name="title" required minLength={1} maxLength={140} defaultValue={itemToEdit?.title} placeholder={collection === "activites" ? "Ex. Formation aux outils numériques" : "Ex. Information importante"} /></label>
                    {collection !== "activites" && <label>Résumé<textarea name="excerpt" maxLength={280} rows={3} defaultValue={editedExcerpt} placeholder="Présentez votre publication en quelques phrases." /></label>}
                    <label>Description complète<textarea name="description" maxLength={20000} rows={8} defaultValue={editedDescription} /></label>
                  </fieldset>
                  {collection === "activites" && (
                    <fieldset className="admin-form-section">
                      <legend><span className="admin-form-step">2</span> Quand et où</legend>
                      <div className="admin-form-row">
                        <label>Date de début<input type="datetime-local" name="startDate" required defaultValue={editedStartDate} /></label>
                        <label>Date de fin<input type="datetime-local" name="endDate" defaultValue={editedEndDate} /></label>
                      </div>
                      <label>Lieu<input name="location" maxLength={200} defaultValue={editedLocation} /></label>
                    </fieldset>
                  )}
                  <fieldset className="admin-form-section">
                    <legend><span className="admin-form-step">{collection === "activites" ? "3" : "2"}</span> Images</legend>
                    <label>Image de couverture<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" /></label>
                    <small className="field-hint">JPEG, PNG ou WebP, 4 Mo maximum.{editedImage ? " L’image actuelle sera conservée si vous n’en choisissez pas une autre." : ""}</small>
                    {itemToEdit && editedImage && <label className="image-remove-option"><input type="checkbox" name="removeImage" /> Supprimer l’image actuelle</label>}
                  </fieldset>
                  <fieldset className="admin-form-section">
                    <legend><span className="admin-form-step">{collection === "activites" ? "4" : "3"}</span> Publication</legend>
                    {collection === "annonces" && (
                      <>
                        <label>Date d’expiration<input type="date" name="expiresAt" defaultValue={editedExpiration} /></label>
                        <small className="field-hint">L’annonce reste visible toute la date choisie et expire à minuit le lendemain.</small>
                      </>
                    )}
                    <label>{collection === "activites" ? "État de l’activité" : "Statut de publication"}<select name="status" defaultValue={editedStatus}>{collection === "activites" ? <><option value="UPCOMING">À venir</option><option value="ONGOING">En cours</option><option value="COMPLETED">Terminée</option></> : <><option value="DRAFT">Brouillon</option><option value="PUBLISHED">Publié</option></>}</select></label>
                    {collection === "annonces" && <small className="field-hint">Les nouvelles annonces sont publiées par défaut. Seules les annonces publiées et non expirées sont visibles par le public.</small>}
                    {collection === "activites" && <label>Visibilité<select name="publicationStatus" defaultValue={editedPublicationStatus ?? "DRAFT"}><option value="DRAFT">Brouillon — non visible</option><option value="PUBLISHED">Publié — visible</option></select></label>}
                  </fieldset>
                </>
              )}
              <details className="admin-form-advanced" open={Boolean(editedLinkHref || editedLinkLabel || (itemToEdit && !editedLinkHref))}>
                <summary><span className="admin-form-step">{collection === "projets" ? "5" : collection === "activites" ? "5" : "4"}</span> Bouton d’action <small>Facultatif</small></summary>
                <div className="admin-form-advanced-body">
                  <AdminActionButtonFields
                    defaultHref={editedLinkHref}
                    defaultLabel={editedLinkLabel}
                    initialWithoutButton={Boolean(itemToEdit && !editedLinkHref)}
                  />
                </div>
              </details>
              <div className="admin-form-sticky-actions">
                <button className="button button-primary" type="submit">{itemToEdit ? <Pencil size={16} /> : <Plus size={16} />} {itemToEdit ? "Enregistrer les modifications" : "Enregistrer"}</button>
                {itemToEdit && (
                  <div className="admin-preview-actions">
                    <Link className="admin-preview-link" href={getAdminPath(`/admin/apercu/${collection}/${itemToEdit.id}`, session.role)} title="Aperçu de la dernière version enregistrée">
                      <Eye size={15} /> Aperçu
                    </Link>
                    <Link className="admin-back" href={getAdminPath(`/admin/${collection}`, session.role)}>Annuler</Link>
                  </div>
                )}
              </div>
            </form>
          )}
        </section>
        <section className="admin-panel admin-article-list">
          <div className="admin-panel-heading"><div><span className="section-kicker"><FileText size={14} /> VOTRE CONTENU</span><h2><CollectionIcon size={19} /> Publications récentes</h2></div></div>
          {items.length || visibleSolutionIds.length ? <div className="admin-table-wrap"><table className="admin-table admin-card-table"><thead><tr><th>Publication</th><th>Statut</th><th className="admin-table-actions-head">Actions</th></tr></thead><tbody>{items.map((item) => {
            const status = item.status;
            const publicationStatus = "publicationStatus" in item ? item.publicationStatus : status;
            const published = publicationStatus === "PUBLISHED";
            const expired =
              collection === "annonces" &&
              status === "PUBLISHED" &&
              "expiresAt" in item &&
              item.expiresAt !== null &&
              item.expiresAt <= new Date();
            const href = `/${collection}#${item.slug}`;
            const displayDate =
              "startDate" in item
                ? item.startDate
                : "projectDate" in item && item.projectDate
                  ? item.projectDate
                  : item.updatedAt;
            const formattedDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(displayDate);
            const views = viewCounts.get(item.id) ?? 0;
            return <tr key={item.id}><td className="admin-table-main" data-label="Publication"><strong>{item.title}</strong><span className="admin-table-meta"><span>/{item.slug}</span><PublicationViewBadge count={views} /><span>{formattedDate}</span></span></td><td data-label="Statut"><span className={`status-pill ${expired ? "expired" : published ? "published" : "draft"}`}>{collection === "activites" ? `${status === "UPCOMING" ? "À venir" : status === "ONGOING" ? "En cours" : "Terminée"} · ${published ? "Publié" : "Brouillon"}` : expired ? "Expirée" : published ? "Publié" : "Brouillon"}</span></td><td className="admin-table-actions" data-label="Actions"><div className="table-row-actions">
              <Link className="table-action" href={getAdminPath(`/admin/${collection}?edit=${item.id}`, session.role)} aria-label={`Modifier ${item.title}`} title="Modifier"><Pencil size={14} /></Link>
              <Link className="table-action" href={getAdminPath(`/admin/apercu/${collection}/${item.id}`, session.role)} aria-label={`Aperçu de ${item.title}`} title="Aperçu"><Eye size={14} /></Link>
              {published && <Link className="table-action" href={href} aria-label={`Voir ${item.title}`} title="Voir sur le site"><ArrowUpRight size={16} /></Link>}
              <form action={deleteContentAction}><input type="hidden" name="kind" value={collection} /><input type="hidden" name="id" value={item.id} /><ConfirmDeleteButton className="table-action table-delete-action" aria-label={`Supprimer ${item.title}`} title={`Supprimer ${item.title}`} confirmationMessage={`Voulez-vous vraiment supprimer la publication « ${item.title} » ?`}><Trash2 size={14} /></ConfirmDeleteButton></form>
            </div></td></tr>;
          })}
          {!items.length && !visibleSolutionIds.length && <tr><td colSpan={3}><div className="admin-empty"><span>✳</span><strong>Votre espace {config.title.toLowerCase()} est prêt.</strong><p>Ajoutez votre première publication avec le formulaire.</p></div></td></tr>}
          {solutionEditorData && visibleSolutionIds.map((solutionId) => {
            const fields = {
              annonces: {
                category: solutionEditorData.settings.solutionAnnoncesCategory,
                href: solutionEditorData.settings.solutionAnnoncesHref,
              },
              bataki: {
                category: solutionEditorData.settings.solutionBatakiCategory,
                href: solutionEditorData.settings.solutionBatakiHref,
              },
              cenou: {
                category: solutionEditorData.settings.solutionCenouCategory,
                href: solutionEditorData.settings.solutionCenouHref,
              },
              immo: {
                category: solutionEditorData.settings.solutionImmoCategory,
                href: solutionEditorData.settings.solutionImmoHref,
              },
            }[solutionId];
            const title = getProjectSolutionName(solutionId, solutionEditorData.settings);
            const published =
              solutionEditorData.settings[solutionStatusKeys[solutionId]] === "PUBLISHED";
            const solutionDate = solutionEditorData.settings[solutionDateKeys[solutionId]];
            const formattedSolutionDate = solutionDate
              ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                  new Date(`${solutionDate}T00:00:00`),
                )
              : "—";
            const isExternal = /^https?:\/\//i.test(fields.href);
            return (
              <tr key={solutionId}>
                  <td className="admin-table-main" data-label="Publication"><strong>{title}</strong><span className="admin-table-meta"><span>{fields.category} · Solution digitale</span><PublicationViewBadge count={viewCounts.get(projectSolutionViewIds[solutionId]) ?? 0} /><span>{formattedSolutionDate}</span></span></td>
                  <td data-label="Statut"><span className={`status-pill ${published ? "published" : "draft"}`}>{published ? "Publié" : "Brouillon"}</span></td>
                  <td className="admin-table-actions" data-label="Actions"><div className="table-row-actions">
                    <Link
                      className="table-action"
                      href={getAdminPath(`/admin/projets?editSolution=${solutionId}`, session.role)}
                      aria-label={`Modifier ${title}`}
                    >
                      <Pencil size={14} />
                    </Link>
                    <Link
                      className="table-action"
                      href={getAdminPath(`/admin/apercu/projets/solution-${solutionId}`, session.role)}
                      aria-label={`Aperçu de ${title}`}
                      title={`Aperçu de ${title}`}
                    >
                      <Eye size={14} />
                    </Link>
                    {published && <Link
                        className="table-action"
                        href={fields.href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        aria-label={`Voir ${title}`}
                      >
                        <ArrowUpRight size={16} />
                      </Link>}
                    <form action={deleteProjectSolutionAction}><input type="hidden" name="solutionId" value={solutionId} /><ConfirmDeleteButton className="table-action table-delete-action" aria-label={`Supprimer ${title}`} title={`Supprimer ${title}`} confirmationMessage={`Voulez-vous vraiment supprimer la publication « ${title} » ?`}><Trash2 size={14} /></ConfirmDeleteButton></form>
                  </div></td>
                </tr>
            );
          })}
          </tbody></table></div> : <div className="admin-empty"><span>✳</span><strong>Votre espace {config.title.toLowerCase()} est prêt.</strong><p>Ajoutez votre première publication avec le formulaire.</p></div>}
        </section>
      </div>
    </AdminShell>
  );
}

function toLocalDateTime(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatExpirationDate(value: Date) {
  const date = new Date(value);
  if (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  ) {
    date.setUTCDate(date.getUTCDate() - 1);
  }
  return date.toISOString().slice(0, 10);
}
