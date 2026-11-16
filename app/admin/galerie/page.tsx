import Link from "next/link";
import { ArrowLeft, Eye, FileImage, ImagePlus, Images, Pencil, Save } from "lucide-react";
import { createMediaAction, deleteMediaAction, updateMediaAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { PublicationViewBadge } from "@/components/publication-view-badge";
import { requireSession } from "@/lib/auth";
import { getAdminPath } from "@/lib/admin-paths";
import { prisma } from "@/lib/prisma";
import { getPublicationViewCounts } from "@/lib/publication-views";

export const instant = false;

export default async function GalleryAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const session = await requireSession();
  const [{ created, updated }, media] = await Promise.all([
    searchParams,
    prisma.media.findMany({
      where: session.role === "ADMIN" ? {} : { uploadedById: session.userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const viewCounts = await getPublicationViewCounts("MEDIA", media.map(({ id }) => id));

  return (
    <AdminShell user={session}>
      <div className="admin-page-heading">
        <div><Link className="admin-back" href={getAdminPath("/admin", session.role)}><ArrowLeft size={14} /> Tableau de bord</Link><span className="section-kicker"><Images size={15} /> MÉDIATHÈQUE</span><h1>Galerie</h1><p>Ajoutez des images pour illustrer les activités DATASYS.</p></div>
        <span className="admin-count">{media.length} image{media.length === 1 ? "" : "s"}</span>
      </div>
      {created && <p className="admin-success">L’image a bien été ajoutée à la galerie.</p>}
      {updated && <p className="admin-success">L’image a bien été modifiée.</p>}
      <div className="admin-editor-layout">
        <section className="admin-panel editor-panel">
          <div className="admin-panel-heading"><div><span className="section-kicker"><ImagePlus size={14} /> NOUVEAU MÉDIA</span><h2><FileImage size={19} /> Ajouter une image</h2></div><ImagePlus size={20} /></div>
          <form className="admin-form" action={createMediaAction}>
            <fieldset className="admin-form-section">
              <legend><span className="admin-form-step">1</span> Fichier</legend>
              <label>Fichier image<input type="file" name="file" accept="image/jpeg,image/png,image/webp" /></label>
              <span className="field-hint">JPEG, PNG ou WebP · 4 Mo maximum.</span>
              <label>Image d’aperçu (facultatif)<input type="file" name="previewImageFile" accept="image/jpeg,image/png,image/webp" /></label>
              <span className="field-hint">Visuel utilisé dans le grand panneau de la galerie. Sans aperçu, l’image de la galerie est affichée.</span>
              <label>Lien de l’image<input type="url" name="url" maxLength={2048} placeholder="https://..." /></label>
            </fieldset>
            <fieldset className="admin-form-section">
              <legend><span className="admin-form-step">2</span> Description</legend>
              <label>Description de l’image<input name="altText" maxLength={240} placeholder="Décrivez l’image pour l’accessibilité." /></label>
              <p className="field-hint">Les fichiers importés sont conservés dans l’espace de stockage du site. Utilisez uniquement des images que DATASYS est autorisé à publier.</p>
            </fieldset>
            <div className="admin-form-sticky-actions">
              <button className="button button-primary" type="submit"><ImagePlus size={16} /> Ajouter à la galerie</button>
            </div>
          </form>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><span className="section-kicker"><Images size={14} /> MÉDIATHÈQUE</span><h2><FileImage size={19} /> Images disponibles</h2></div></div>
          {media.length ? <div className="admin-media-grid">{media.map((item) => <article className="admin-media-card" key={item.id}>
            <div className="admin-media-image">
              <img src={item.url} alt={item.altText ?? ""} />
            </div>
            <div><strong>{item.altText || "Image sans description"}</strong><small>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(item.createdAt)}</small><PublicationViewBadge count={viewCounts.get(item.id) ?? 0} showLabel /></div>
            <div className="admin-media-actions">
              <Link
                className="table-action"
                href={getAdminPath(`/admin/apercu/galerie/${item.id}`, session.role)}
                aria-label={`Aperçu de ${item.altText || "l’image"}`}
                title="Aperçu du panneau"
              >
                <Eye size={14} />
              </Link>
              <details className="admin-media-edit">
                <summary className="table-action" aria-label={`Modifier ${item.altText || "l’image"}`} title="Modifier">
                  <Pencil size={14} />
                </summary>
                <form className="admin-form" action={updateMediaAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <label>Lien de l’image<input type="text" name="url" maxLength={2048} defaultValue={item.url} required /></label>
                  <label>Description de l’image<input name="altText" maxLength={240} defaultValue={item.altText ?? ""} placeholder="Décrivez l’image pour l’accessibilité." /></label>
                  <label>Image d’aperçu (facultatif)<input type="file" name="previewImageFile" accept="image/jpeg,image/png,image/webp" /></label>
                  <span className="field-hint">Visuel utilisé dans le grand panneau de la galerie. Sans aperçu, l’image de la galerie est affichée.</span>
                  {item.previewImage && <label className="image-remove-option"><input type="checkbox" name="removePreviewImage" /> Supprimer l’image d’aperçu</label>}
                  <button className="button button-primary" type="submit"><Save size={15} /> Enregistrer</button>
                </form>
              </details>
              <form action={deleteMediaAction}>
                <input type="hidden" name="id" value={item.id} />
                <ConfirmDeleteButton
                  className="admin-media-remove"
                  confirmationMessage={`Voulez-vous vraiment retirer l’image « ${item.altText || "Image sans description"} » de la galerie ?`}
                  title="Retirer cette image"
                  aria-label={`Retirer ${item.altText || "cette image"}`}
                >
                  Retirer
                </ConfirmDeleteButton>
              </form>
            </div>
          </article>)}</div> : <div className="admin-empty"><span>✳</span><strong>La galerie est vide pour le moment.</strong><p>Ajoutez un lien d’image pour commencer.</p></div>}
        </section>
      </div>
    </AdminShell>
  );
}
