"use client";

import { useState } from "react";

export function AdminActionButtonFields({
  defaultHref = "",
  defaultLabel = "",
  initialWithoutButton = false,
}: {
  defaultHref?: string;
  defaultLabel?: string;
  initialWithoutButton?: boolean;
}) {
  const [withoutButton, setWithoutButton] = useState(initialWithoutButton);

  return (
    <>
      <label className="admin-button-toggle">
        <input
          type="checkbox"
          name="withoutButton"
          checked={withoutButton}
          onChange={(event) => setWithoutButton(event.target.checked)}
        />
        Ne pas afficher de bouton
      </label>
      <div className="admin-button-fields" data-disabled={withoutButton ? "true" : "false"}>
        <label>
          Lien du bouton
          <input
            name="linkHref"
            type="text"
            maxLength={2048}
            defaultValue={defaultHref}
            placeholder="https://exemple.com ou /page-interne"
            disabled={withoutButton}
          />
        </label>
        <label>
          Texte du bouton
          <input
            name="linkLabel"
            maxLength={100}
            defaultValue={defaultLabel}
            placeholder="Ex. En savoir plus"
            disabled={withoutButton}
          />
        </label>
      </div>
      <small className="field-hint">
        {withoutButton
          ? "Aucun bouton ne sera affiché sur cette publication."
          : "Laissez vide pour utiliser le bouton par défaut « En savoir plus » vers la page Contact."}
      </small>
    </>
  );
}
