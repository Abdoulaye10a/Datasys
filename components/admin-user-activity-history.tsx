"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { z } from "zod";
import {
  deleteAllUserActivitiesAction,
  deleteSelectedUserActivitiesAction,
  deleteUserActivityAction,
} from "@/app/admin/actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

const historyPageSchema = z.object({
  entries: z.array(z.object({
    id: z.string(),
    createdAt: z.string(),
    formattedDate: z.string(),
    actorName: z.string(),
    actorEmail: z.string(),
    action: z.string(),
    details: z.string(),
  })),
  totalCount: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageCount: z.number().int().positive(),
});

const errorResponseSchema = z.object({ error: z.string() });

type UserActivityEntry = {
  id: string;
  createdAt: string;
  formattedDate: string;
  actorName: string;
  actorEmail: string;
  action: string;
  details: string;
};

export function AdminUserActivityHistory({
  initialEntries,
  initialTotalCount,
  initialPage,
  initialPageCount,
}: {
  initialEntries: UserActivityEntry[];
  initialTotalCount: number;
  initialPage: number;
  initialPageCount: number;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [page, setPage] = useState(initialPage);
  const [pageCount, setPageCount] = useState(initialPageCount);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const allSelected = entries.length > 0 && selectedIds.length === entries.length;

  const loadPage = useCallback(async (requestedPage: number, updateUrl = true) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`/espace-admin/api/user-activity?page=${requestedPage}`, {
        cache: "no-store",
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const errorResult = errorResponseSchema.safeParse(body);
        throw new Error(errorResult.success ? errorResult.data.error : "Impossible de charger l’historique.");
      }

      const result = historyPageSchema.parse(body);
      setEntries(result.entries);
      setTotalCount(result.totalCount);
      setPage(result.page);
      setPageCount(result.pageCount);
      setSelectedIds([]);
      if (updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set("historyPage", String(result.page));
        window.history.pushState(null, "", url);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Impossible de charger l’historique.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    function handlePopState() {
      const requestedPage = Number(new URLSearchParams(window.location.search).get("historyPage") ?? "1");
      if (Number.isInteger(requestedPage) && requestedPage > 0) {
        void loadPage(requestedPage, false);
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [loadPage]);

  function toggleEntry(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  }

  function toggleAllEntries() {
    setSelectedIds(allSelected ? [] : entries.map((entry) => entry.id));
  }

  return (
    <>
      <div className="admin-history-toolbar">
        <label className="message-selection-all">
          <input
            type="checkbox"
            checked={allSelected}
            disabled={entries.length === 0}
            onChange={toggleAllEntries}
            aria-label="Sélectionner toutes les actions de cette page"
          />
          <span>Sélectionner cette page ({entries.length})</span>
        </label>
        {selectedIds.length > 0 && (
          <form action={deleteSelectedUserActivitiesAction}>
            {selectedIds.map((id) => (
              <input type="hidden" name="activityIds" value={id} key={id} />
            ))}
            <ConfirmDeleteButton
              className="button message-bulk-delete-button"
              aria-label={`Supprimer ${selectedIds.length} action${selectedIds.length === 1 ? "" : "s"} sélectionnée${selectedIds.length === 1 ? "" : "s"}`}
              title="Supprimer la sélection"
              confirmationMessage={`Voulez-vous vraiment supprimer les ${selectedIds.length} action${selectedIds.length === 1 ? "" : "s"} sélectionnée${selectedIds.length === 1 ? "" : "s"} ?`}
            >
              <Trash2 size={15} /> Supprimer la sélection ({selectedIds.length})
            </ConfirmDeleteButton>
          </form>
        )}
        {totalCount > 0 && (
          <form action={deleteAllUserActivitiesAction}>
            <ConfirmDeleteButton
              className="button message-bulk-delete-button"
              aria-label={`Supprimer les ${totalCount} actions de l’historique`}
              title="Tout supprimer"
              confirmationMessage={`Cette action supprimera définitivement les ${totalCount} actions de l’historique, y compris celles des autres pages. Pour confirmer, saisissez « TOUT SUPPRIMER ».`}
              confirmationText="TOUT SUPPRIMER"
            >
              <Trash2 size={15} /> Tout supprimer
            </ConfirmDeleteButton>
          </form>
        )}
      </div>
      {loadError && <p className="form-feedback error" role="alert">{loadError}</p>}
      <div
        className="admin-table-wrap admin-history-scroll"
        role="region"
        aria-label="Historique des actions, faites défiler pour consulter les plus anciennes"
        aria-busy={isLoading}
        tabIndex={0}
      >
        <table className="admin-table admin-history-table">
          <thead>
            <tr><th>Sélection</th><th>Date</th><th>Utilisateur</th><th>Action</th><th>Détail</th><th>Supprimer</th></tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <label className="message-selection-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(entry.id)}
                      onChange={() => toggleEntry(entry.id)}
                      aria-label={`Sélectionner l’action « ${entry.action} : ${entry.details} »`}
                    />
                  </label>
                </td>
                <td><time dateTime={entry.createdAt}>{entry.formattedDate}</time></td>
                <td><strong>{entry.actorName}</strong><small>{entry.actorEmail}</small></td>
                <td><span className="status-pill draft">{entry.action}</span></td>
                <td>{entry.details}</td>
                <td>
                  <form action={deleteUserActivityAction}>
                    <input type="hidden" name="id" value={entry.id} />
                    <ConfirmDeleteButton
                      className="table-action table-delete-action"
                      aria-label={`Supprimer l’action « ${entry.action} : ${entry.details} »`}
                      title="Supprimer cette action"
                      confirmationMessage={`Voulez-vous vraiment supprimer cette action : « ${entry.action} : ${entry.details} » ?`}
                    >
                      <Trash2 size={14} />
                    </ConfirmDeleteButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <nav className="pagination admin-history-pagination" aria-label="Pagination de l’historique">
          <button
            type="button"
            aria-label="Actions plus récentes"
            disabled={page <= 1 || isLoading}
            onClick={() => void loadPage(page - 1)}
          >
            <ArrowLeft size={16} /> <span className="pagination-button-label">Plus récentes</span>
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              aria-label={`Page ${pageNumber}`}
              aria-current={pageNumber === page ? "page" : undefined}
              disabled={isLoading || pageNumber === page}
              onClick={() => void loadPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <span className="pagination-status" aria-live="polite">
            {isLoading ? "Chargement…" : <>Page <strong>{page}</strong> sur <strong>{pageCount}</strong></>}
          </span>
          <button
            type="button"
            aria-label="Actions précédentes"
            disabled={page >= pageCount || isLoading}
            onClick={() => void loadPage(page + 1)}
          >
            <span className="pagination-button-label">Précédentes</span> <ArrowRight size={16} />
          </button>
        </nav>
      )}
    </>
  );
}
