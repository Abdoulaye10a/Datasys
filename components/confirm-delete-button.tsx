"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { ButtonHTMLAttributes } from "react";

type ConfirmDeleteButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "onClick"
> & {
  confirmationMessage: string;
  confirmationText?: string;
};

export function ConfirmDeleteButton({
  confirmationMessage,
  confirmationText,
  ...buttonProps
}: ConfirmDeleteButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogId = useId();
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const requiresTypedConfirmation = confirmationText !== undefined;
  const canConfirm = !requiresTypedConfirmation || typedConfirmation === confirmationText;

  return (
    <>
      <button
        {...buttonProps}
        type="submit"
        onClick={(event) => {
          event.preventDefault();
          setTypedConfirmation("");
          dialogRef.current?.showModal();
        }}
      />
      <dialog
        className="delete-confirm-dialog"
        ref={dialogRef}
        aria-labelledby={`${dialogId}-title`}
        aria-describedby={`${dialogId}-description`}
      >
        <div className="delete-confirm-icon"><AlertTriangle size={23} /></div>
        <button
          className="delete-confirm-close"
          type="button"
          aria-label="Fermer la confirmation"
          onClick={() => dialogRef.current?.close()}
        >
          <X size={18} />
        </button>
        <span className="delete-confirm-kicker">SUPPRESSION</span>
        <h2 id={`${dialogId}-title`}>Confirmer la suppression</h2>
        <p id={`${dialogId}-description`}>{confirmationMessage}</p>
        {requiresTypedConfirmation && (
          <label className="delete-confirm-verification">
            Saisissez <strong>{confirmationText}</strong> pour autoriser la suppression.
            <input
              autoComplete="off"
              value={typedConfirmation}
              onChange={(event) => setTypedConfirmation(event.target.value)}
              aria-label={`Saisissez ${confirmationText} pour confirmer`}
            />
          </label>
        )}
        <div className="delete-confirm-actions">
          <button
            className="delete-confirm-cancel"
            type="button"
            onClick={() => {
              setTypedConfirmation("");
              dialogRef.current?.close();
            }}
          >
            Annuler
          </button>
          <button
            className="delete-confirm-submit"
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              const form = dialogRef.current?.closest("form");
              dialogRef.current?.close();
              form?.requestSubmit();
            }}
          >
            <Trash2 size={15} />
            Oui, supprimer
          </button>
        </div>
      </dialog>
    </>
  );
}
