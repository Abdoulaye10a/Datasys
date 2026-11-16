import Link from "next/link";
import { ArrowLeft, Check, Clock3, LockKeyhole, LockKeyholeOpen, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import {
  deleteUserAction,
  setUserBlockedAction,
  updateUserRoleAction,
} from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { AdminCreateUserForm } from "@/components/admin-create-user-form";
import { AdminUserActivityHistory } from "@/components/admin-user-activity-history";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminPath } from "@/lib/admin-paths";

export const instant = false;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string; historyPage?: string }>;
}) {
  const session = await requireAdmin();
  const [{ created, error, historyPage: requestedHistoryPage }, users, historyCount] = await Promise.all([
    searchParams,
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isBlocked: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userActivity.count(),
  ]);
  const historyPageSize = 50;
  const historyPageCount = Math.max(1, Math.ceil(historyCount / historyPageSize));
  const requestedPage = Number.parseInt(requestedHistoryPage ?? "1", 10);
  const historyPage = Math.min(
    Math.max(Number.isInteger(requestedPage) ? requestedPage : 1, 1),
    historyPageCount,
  );
  const history = await prisma.userActivity.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (historyPage - 1) * historyPageSize,
    take: historyPageSize,
  });
  const historyDateFormatter = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <AdminShell user={session}>
      <div className="admin-page-heading">
        <div><Link className="admin-back" href={getAdminPath("/admin", session.role)}><ArrowLeft size={14} /> Tableau de bord</Link><span className="section-kicker"><Users size={15} /> PARAMÈTRES</span><h1>Utilisateurs</h1><p>Gérez les accès des administrateurs et des rédacteurs.</p></div>
        <span className="admin-count">{users.filter((user) => !user.isBlocked).length} compte{users.filter((user) => !user.isBlocked).length === 1 ? "" : "s"} actif{users.filter((user) => !user.isBlocked).length === 1 ? "" : "s"}</span>
      </div>
      {created && <p className="admin-success" role="status">Le compte a été créé avec succès.</p>}
      <div className="admin-editor-layout">
        <section className="admin-panel editor-panel">
          <div className="admin-panel-heading"><div><span className="section-kicker"><UserPlus size={14} /> NOUVEL ACCÈS</span><h2><ShieldCheck size={19} /> Inviter un utilisateur</h2></div><UserPlus size={20} /></div>
          {error === "email-exists" && <p className="form-feedback error" role="alert">Un compte existe déjà avec cette adresse e-mail.</p>}
          <AdminCreateUserForm />
        </section>
        <section className="admin-panel admin-article-list">
          <div className="admin-panel-heading"><div><span className="section-kicker"><Users size={14} /> ACCÈS AU SITE</span><h2><ShieldCheck size={19} /> Comptes utilisateurs</h2></div><Users size={20} /></div>
          <div className="admin-table-wrap"><table className="admin-table admin-card-table admin-users-table"><thead><tr><th>Utilisateur</th><th>Rôle</th><th>Accès</th><th className="admin-table-actions-head">Actions</th></tr></thead><tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="admin-table-main" data-label="Utilisateur"><strong>{user.name}</strong><span className="admin-table-meta"><span>{user.email}</span><span>Depuis le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(user.createdAt)}</span></span></td>
                <td data-label="Rôle">{user.id === session.userId ? <span className="status-pill published">{user.role === "ADMIN" ? "Administrateur" : "Rédacteur"} · vous</span> : <form className="inline-role-form" action={updateUserRoleAction}><input type="hidden" name="id" value={user.id} /><select name="role" defaultValue={user.role} aria-label={`Rôle de ${user.name}`}><option value="ADMIN">Administrateur</option><option value="EDITOR">Rédacteur</option></select><button className="role-save-button" type="submit" aria-label={`Enregistrer le rôle de ${user.name}`}><Check size={15} /><span>Enregistrer</span></button></form>}</td>
                <td data-label="Accès"><span className={`status-pill ${user.isBlocked ? "user-blocked" : "published"}`}>{user.isBlocked ? "Bloqué" : "Actif"}</span></td>
                <td className="admin-table-actions" data-label="Actions">
                  {user.id !== session.userId ? (
                    <div className="user-row-actions">
                      <form action={setUserBlockedAction}>
                        <input type="hidden" name="id" value={user.id} />
                        <input type="hidden" name="isBlocked" value={user.isBlocked ? "false" : "true"} />
                        <button
                          className={`user-access-button${user.isBlocked ? " is-unblock" : ""}`}
                          type="submit"
                          aria-label={`${user.isBlocked ? "Débloquer" : "Bloquer"} ${user.name}`}
                        >
                          {user.isBlocked ? <LockKeyholeOpen size={14} /> : <LockKeyhole size={14} />}
                          {user.isBlocked ? "Débloquer" : "Bloquer"}
                        </button>
                      </form>
                      <form action={deleteUserAction}>
                        <input type="hidden" name="id" value={user.id} />
                        <ConfirmDeleteButton
                          className="user-delete-button"
                          aria-label={`Supprimer ${user.name}`}
                          title={`Supprimer ${user.name}`}
                          confirmationMessage={`Cette action supprimera le compte de ${user.name} (${user.email}). Ses publications, médias et réponses seront conservés et réattribués à votre compte.`}
                          confirmationText={user.email}
                        >
                          <Trash2 size={14} /> Supprimer
                        </ConfirmDeleteButton>
                      </form>
                    </div>
                  ) : (
                    <span className="admin-table-self">Votre compte</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody></table></div>
        </section>
      </div>
      <section className="admin-panel admin-user-history">
        <div className="admin-panel-heading">
          <div>
            <span className="section-kicker"><Clock3 size={14} /> SUIVI DES COMPTES</span>
            <h2><Clock3 size={19} /> Historique des actions</h2>
          </div>
          <span className="admin-count">{historyCount} action{historyCount === 1 ? "" : "s"}</span>
        </div>
        <p className="admin-history-note">Connexions, modifications et suppressions réalisées dans l’espace d’administration.</p>
        {history.length ? (
          <>
            <AdminUserActivityHistory
              key={`${historyPage}-${historyCount}-${history[0]?.id ?? ""}`}
              initialEntries={history.map((entry) => ({
                id: entry.id,
                createdAt: entry.createdAt.toISOString(),
                formattedDate: historyDateFormatter.format(entry.createdAt),
                actorName: entry.actorName,
                actorEmail: entry.actorEmail,
                action: entry.action,
                details: entry.details,
              }))}
              initialTotalCount={historyCount}
              initialPage={historyPage}
              initialPageCount={historyPageCount}
            />
          </>
        ) : (
          <div className="admin-empty">
            <span>✳</span>
            <strong>Aucune action enregistrée pour le moment.</strong>
            <p>Les prochaines activités des comptes apparaîtront ici.</p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
