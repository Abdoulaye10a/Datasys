import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Eye, FileText, Newspaper, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { AdminActionButtonFields } from "@/components/admin-action-button-fields";
import { PublicationViewBadge } from "@/components/publication-view-badge";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { createArticleAction, deleteArticleAction } from "@/app/admin/actions";
import { requireSession } from "@/lib/auth";
import { getAdminPath } from "@/lib/admin-paths";
import { prisma } from "@/lib/prisma";
import { getPublicationViewCounts } from "@/lib/publication-views";

export const instant = false;

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; edit?: string }>;
}) {
  const session = await requireSession();
  const [articles, categories, { created, updated, edit }] = await Promise.all([
    prisma.article.findMany({
      where: session.role === "ADMIN" ? {} : { authorId: session.userId },
      include: { category: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    searchParams,
  ]);
  const viewCounts = await getPublicationViewCounts("ARTICLE", articles.map(({ id }) => id));
  const articleToEdit = edit ? articles.find((article) => article.id === edit) : undefined;

  return (
    <AdminShell user={session}>
      <div className="admin-page-heading">
        <div><Link className="admin-back" href={getAdminPath("/admin", session.role)}><ArrowLeft size={14} /> Tableau de bord</Link><span className="section-kicker"><Newspaper size={15} /> PUBLICATIONS</span><h1>Actualités</h1><p>Rédigez, relisez et publiez les nouvelles de DATASYS.</p></div>
        <span className="admin-count">{articles.length} article{articles.length === 1 ? "" : "s"}</span>
      </div>
      {(created || updated) && <p className="admin-success">{updated ? "Votre actualité a bien été modifiée." : "Votre actualité a bien été enregistrée."}</p>}
      <div className="admin-editor-layout">
        <section className="admin-panel editor-panel">
          <div className="admin-panel-heading"><div><span className="section-kicker">{articleToEdit ? <Pencil size={14} /> : <Plus size={14} />}{articleToEdit ? "MODIFICATION" : "NOUVELLE PUBLICATION"}</span><h2><Newspaper size={19} /> {articleToEdit ? "Modifier l’article" : "Rédiger un article"}</h2></div><div className="admin-heading-actions"><Newspaper size={20} className="admin-heading-icon" /><button className="admin-heading-save" type="submit" form="article-form"><Save size={15} /><span>Enregistrer</span></button></div></div>
          <form id="article-form" className="admin-form" action={createArticleAction}>
            {articleToEdit && <input type="hidden" name="id" value={articleToEdit.id} />}
            <fieldset className="admin-form-section">
              <legend><span className="admin-form-step">1</span> Contenu de l’article</legend>
              <label>Titre<input name="title" required minLength={1} maxLength={140} defaultValue={articleToEdit?.title} placeholder="Ex. DATASYS lance..." /></label>
              <label>Résumé<textarea name="excerpt" maxLength={280} rows={3} defaultValue={articleToEdit?.excerpt} placeholder="Présentez votre actualité en quelques phrases." /><small className="field-hint">Affiché dans les listes et les cartes de la rubrique.</small></label>
              <label>Description complète<textarea name="content" maxLength={20000} rows={8} defaultValue={articleToEdit?.content} placeholder="Rédigez le contenu complet de votre article." /></label>
            </fieldset>

            <fieldset className="admin-form-section">
              <legend><span className="admin-form-step">2</span> Images</legend>
              <label>Image de couverture<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" /></label>
              <small className="field-hint">JPEG, PNG ou WebP, 5 Mo maximum.{articleToEdit?.image ? " L’image actuelle sera conservée si vous n’en choisissez pas une autre." : ""}</small>
              {articleToEdit?.image && <label className="image-remove-option"><input type="checkbox" name="removeImage" /> Supprimer l’image actuelle</label>}
            </fieldset>

            <fieldset className="admin-form-section">
              <legend><span className="admin-form-step">3</span> Publication</legend>
              <div className="admin-form-row">
                <label>Catégorie<select name="categoryId" defaultValue={articleToEdit?.categoryId ?? ""}><option value="">Sans catégorie</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
                <label>Statut<select name="status" defaultValue={articleToEdit?.status ?? "DRAFT"}><option value="DRAFT">Brouillon</option><option value="PUBLISHED">Publié</option></select></label>
              </div>
            </fieldset>

            <details className="admin-form-advanced" open={Boolean(articleToEdit?.linkHref || articleToEdit?.linkLabel || (articleToEdit && !articleToEdit.linkHref))}>
              <summary><span className="admin-form-step">4</span> Bouton d’action <small>Facultatif</small></summary>
              <div className="admin-form-advanced-body">
                <AdminActionButtonFields
                  defaultHref={articleToEdit?.linkHref ?? ""}
                  defaultLabel={articleToEdit?.linkLabel ?? ""}
                  initialWithoutButton={Boolean(articleToEdit && !articleToEdit.linkHref)}
                />
              </div>
            </details>

            <div className="admin-form-sticky-actions">
              <button className="button button-primary" type="submit">{articleToEdit ? <Pencil size={16} /> : <Plus size={16} />} {articleToEdit ? "Enregistrer les modifications" : "Enregistrer l’article"}</button>
              {articleToEdit && (
                <div className="admin-preview-actions">
                  <Link className="admin-preview-link" href={getAdminPath(`/admin/apercu/actualites/${articleToEdit.id}`, session.role)} title="Aperçu de la dernière version enregistrée">
                    <Eye size={15} /> Aperçu
                  </Link>
                  <Link className="admin-back" href={getAdminPath("/admin/actualites", session.role)}>Annuler</Link>
                </div>
              )}
            </div>
          </form>
        </section>
        <section className="admin-panel admin-article-list">
          <div className="admin-panel-heading"><div><span className="section-kicker"><FileText size={14} /> VOTRE CONTENU</span><h2><Newspaper size={19} /> Publications récentes</h2></div></div>
          {articles.length ? (
            <div className="admin-table-wrap"><table className="admin-table admin-card-table"><thead><tr><th>Publication</th><th>Statut</th><th className="admin-table-actions-head">Actions</th></tr></thead><tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td className="admin-table-main" data-label="Publication">
                    <strong>{article.title}</strong>
                    <span className="admin-table-meta">
                      <span>{article.category?.name ?? "Sans catégorie"}</span>
                      <PublicationViewBadge count={viewCounts.get(article.id) ?? 0} />
                      <span>{dateFormat.format(article.updatedAt)}</span>
                    </span>
                  </td>
                  <td data-label="Statut"><span className={`status-pill ${article.status === "PUBLISHED" ? "published" : "draft"}`}>{article.status === "PUBLISHED" ? "Publié" : "Brouillon"}</span></td>
                  <td className="admin-table-actions" data-label="Actions"><div className="table-row-actions">
                    <Link className="table-action" href={getAdminPath(`/admin/actualites?edit=${article.id}`, session.role)} aria-label={`Modifier ${article.title}`} title="Modifier"><Pencil size={14} /></Link>
                    <Link className="table-action" href={getAdminPath(`/admin/apercu/actualites/${article.id}`, session.role)} aria-label={`Aperçu de ${article.title}`} title="Aperçu"><Eye size={14} /></Link>
                    {article.status === "PUBLISHED" ? (
                      <Link className="table-action" href={`/actualites#${article.slug}`} aria-label={`Voir ${article.title}`} title="Voir sur le site"><ArrowUpRight size={16} /></Link>
                    ) : null}
                    <form action={deleteArticleAction}><input type="hidden" name="id" value={article.id} /><ConfirmDeleteButton className="table-action table-delete-action" aria-label={`Supprimer ${article.title}`} title={`Supprimer ${article.title}`} confirmationMessage={`Voulez-vous vraiment supprimer la publication « ${article.title} » ?`}><Trash2 size={14} /></ConfirmDeleteButton></form>
                  </div></td>
                </tr>
              ))}
            </tbody></table></div>
          ) : (
            <div className="admin-empty"><span>✳</span><strong>Le journal est prêt pour votre première histoire.</strong><p>Créez un article avec le formulaire pour le voir apparaître ici.</p></div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
