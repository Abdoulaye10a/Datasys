"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { deleteSelectedMessagesAction } from "@/app/admin/actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

type MessageSelectionContextValue = {
  selectedIds: string[];
  toggle: (id: string) => void;
  toggleAll: () => void;
  messageIds: string[];
};

const MessageSelectionContext = createContext<MessageSelectionContextValue | null>(null);

function useMessageSelection() {
  const context = useContext(MessageSelectionContext);
  if (!context) {
    throw new Error("Les contrôles de sélection doivent être dans AdminMessageSelection.");
  }
  return context;
}

export function AdminMessageSelection({
  messageIds,
  children,
}: {
  messageIds: string[];
  children: ReactNode;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allSelected = messageIds.length > 0 && selectedIds.length === messageIds.length;

  function toggle(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : messageIds);
  }

  return (
    <MessageSelectionContext.Provider value={{ selectedIds, toggle, toggleAll, messageIds }}>
      {children}
    </MessageSelectionContext.Provider>
  );
}

export function AdminMessageSelectionToolbar() {
  const { selectedIds, toggleAll, messageIds } = useMessageSelection();
  const allSelected = messageIds.length > 0 && selectedIds.length === messageIds.length;

  return (
    <div className="message-selection-toolbar">
      <label className="message-selection-all">
        <input
          type="checkbox"
          checked={allSelected}
          disabled={messageIds.length === 0}
          onChange={toggleAll}
          aria-label="Sélectionner tous les messages"
        />
        <span>Tout sélectionner</span>
      </label>
      {selectedIds.length > 0 && (
        <form action={deleteSelectedMessagesAction}>
          {selectedIds.map((id) => (
            <input type="hidden" name="messageIds" value={id} key={id} />
          ))}
          <ConfirmDeleteButton
            className="button message-bulk-delete-button"
            aria-label={`Supprimer ${selectedIds.length} message${selectedIds.length === 1 ? "" : "s"} sélectionné${selectedIds.length === 1 ? "" : "s"}`}
            title="Supprimer la sélection"
            confirmationMessage={`Voulez-vous vraiment supprimer ${selectedIds.length} message${selectedIds.length === 1 ? "" : "s"} sélectionné${selectedIds.length === 1 ? "" : "s"} ainsi que leur historique de réponses ?`}
          >
            <Trash2 size={15} /> Supprimer la sélection ({selectedIds.length})
          </ConfirmDeleteButton>
        </form>
      )}
    </div>
  );
}

export function AdminMessageSelectCheckbox({
  messageId,
  messageName,
}: {
  messageId: string;
  messageName: string;
}) {
  const { selectedIds, toggle } = useMessageSelection();
  return (
    <label className="message-selection-checkbox">
      <input
        type="checkbox"
        checked={selectedIds.includes(messageId)}
        onChange={() => toggle(messageId)}
        aria-label={`Sélectionner le message de ${messageName}`}
      />
    </label>
  );
}
