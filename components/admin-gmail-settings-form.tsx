"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import {
  saveGmailConfigurationAction,
  type GmailConfigurationState,
} from "@/app/admin/actions";

const initialState: GmailConfigurationState = {};

export function AdminGmailSettingsForm({
  configured,
  account,
  allowedFrom,
}: {
  configured: boolean;
  account: string;
  allowedFrom: string[];
}) {
  const [accountValue, setAccountValue] = useState(account);
  const [appPasswordValue, setAppPasswordValue] = useState("");
  const [showAppPassword, setShowAppPassword] = useState(false);
  const [allowedFromValue, setAllowedFromValue] = useState(allowedFrom.join("\n"));
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();

  return (
    <details className="admin-panel gmail-settings-panel" open={!configured}>
      <summary className="admin-panel-heading">
        <span className="gmail-settings-heading">
          <strong><Mail size={18} aria-hidden="true" /> Configuration Gmail</strong>
          <span>Réglages de l’envoi des réponses</span>
        </span>
        <span className={`status-pill ${configured ? "published" : "draft"}`}>
          {configured ? "Compte configuré" : "Configuration requise"}
        </span>
        <ChevronDown className="gmail-settings-chevron" size={17} aria-hidden="true" />
      </summary>
      {configured && !state.error && !state.success && (
        <p className="field-hint">
          Envoi vérifié pour <strong>{account}</strong>
          {allowedFrom.length ? ` · Alias : ${allowedFrom.join(", ")}` : ""}
        </p>
      )}
      {state.error && (
        <p className="form-feedback error" role="alert">
          <AlertCircle size={16} /> {state.error}
        </p>
      )}
      {state.success && (
        <p className="form-feedback success" role="status">
          <CheckCircle2 size={16} /> {state.success}
        </p>
      )}
      <form
        className="admin-form"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            const result = await saveGmailConfigurationAction(state, formData);
            setState(result);
            if (result.success) {
              setAppPasswordValue("");
              setShowAppPassword(false);
            }
          });
        }}
      >
        <label>
          Compte Gmail d’envoi
          <input
            type="email"
            name="account"
            required
            maxLength={254}
            value={accountValue}
            onChange={(event) => setAccountValue(event.currentTarget.value)}
            autoComplete="username"
          />
        </label>
        <label>
          <span className="message-reply-label"><KeyRound size={14} /> Mot de passe d’application Gmail</span>
          <div className="password-input-wrap">
            <input
              type={showAppPassword ? "text" : "password"}
              name="appPassword"
              required={!configured}
              maxLength={200}
              value={appPasswordValue}
              onChange={(event) => setAppPasswordValue(event.currentTarget.value)}
              autoComplete="new-password"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={configured ? "Déjà enregistré — laisser vide pour le conserver" : "Mot de passe d’application à 16 caractères"}
            />
            <button
              className="password-visibility"
              type="button"
              aria-label={showAppPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              aria-pressed={showAppPassword}
              onClick={() => setShowAppPassword((visible) => !visible)}
            >
              {showAppPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        <label>
          Adresses alias autorisées (une par ligne)
          <textarea
            name="allowedFrom"
            rows={3}
            maxLength={2000}
            value={allowedFromValue}
            onChange={(event) => setAllowedFromValue(event.currentTarget.value)}
            placeholder="exemple@votredomaine.com"
          />
        </label>
        <p className="field-hint">
          Créez un mot de passe d’application dans la sécurité de votre compte Google (validation en deux étapes requise). Chaque adresse alias doit également être ajoutée et vérifiée dans Gmail. Le mot de passe est chiffré avant son stockage et n’est jamais réaffiché.
        </p>
        <button className="button button-primary" type="submit" disabled={pending}>
          <ShieldCheck size={15} />
          {pending ? "Vérification de Gmail…" : "Vérifier et enregistrer"}
        </button>
      </form>
    </details>
  );
}
