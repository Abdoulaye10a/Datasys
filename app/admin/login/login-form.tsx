"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, CircleHelp, FileText, KeyRound, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { loginAction, type LoginState } from "@/app/admin/actions";
import { PasswordField } from "@/components/password-field";
import type { AdminSpace } from "@/lib/admin-paths";

const initialState: LoginState = {};

export function LoginForm({ space }: { space: AdminSpace | null }) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (state.lockoutUntil === undefined) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [state.lockoutUntil]);

  const remainingSeconds =
    state.lockoutUntil === undefined
      ? 0
      : Math.max(0, Math.ceil((state.lockoutUntil - now) / 1000));

  return (
    <form key={state.attempt ?? 0} className="login-form" action={action}>
      {space ? (
        <input type="hidden" name="role" value={space === "admin" ? "ADMIN" : "EDITOR"} />
      ) : (
        <fieldset className="login-role-group">
          <legend>Type de compte</legend>
          <div className="login-role-options">
          <label className="login-role-option">
            <input
              type="radio"
              name="role"
              value="ADMIN"
              defaultChecked={state.role === "ADMIN"}
              required
            />
            <span className="login-role-top">
              <span className="login-role-icon" aria-hidden="true"><ShieldCheck size={19} /></span>
              <span className="login-role-check" aria-hidden="true" />
            </span>
            <span className="login-role-copy">
              <strong>Administrateur</strong>
              <small>Gestion complète du site</small>
            </span>
          </label>
          <label className="login-role-option">
            <input
              type="radio"
              name="role"
              value="EDITOR"
              defaultChecked={state.role !== "ADMIN"}
              required
            />
            <span className="login-role-top">
              <span className="login-role-icon" aria-hidden="true"><FileText size={18} /></span>
              <span className="login-role-check" aria-hidden="true" />
            </span>
            <span className="login-role-copy">
              <strong>Rédacteur</strong>
              <small>Articles et contenus</small>
            </span>
          </label>
          </div>
        </fieldset>
      )}
      <label className="login-email-field">
        <span className="login-field-label"><Mail size={15} /> Adresse e-mail</span>
        <span className="login-input-wrap">
          <Mail size={17} aria-hidden="true" />
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            maxLength={254}
            defaultValue={state.email ?? ""}
          />
        </span>
      </label>
      <PasswordField
        id="admin-login-password"
        label={<><KeyRound size={15} /> Mot de passe</>}
        name="password"
        autoComplete="current-password"
        required
      />
      {state.error && (
        <p className="login-password-note">
          Pour votre sécurité, ressaisissez votre mot de passe après une erreur.
        </p>
      )}
      {state.error && <p className="form-feedback error" role="alert"><AlertCircle size={17} /> {state.error}</p>}
      {state.lockoutUntil !== undefined && (
        <p className="login-countdown" aria-live="off">
          {remainingSeconds > 0
            ? `Réessayez dans ${Math.floor(remainingSeconds / 60)} min ${String(remainingSeconds % 60).padStart(2, "0")} s.`
            : "Le délai est écoulé. Vous pouvez réessayer."}
        </p>
      )}
      <button className="button button-primary login-submit" type="submit" disabled={pending}>
        {pending ? <><LoaderCircle className="login-spinner" size={17} /> Connexion...</> : <>Accéder à mon espace <ArrowRight size={16} /></>}
      </button>
      <p className="login-secure"><LockKeyhole size={14} /> Connexion sécurisée</p>
    </form>
  );
}

export default function LoginPage({
  logoUrl,
  space,
}: {
  logoUrl: string;
  space: AdminSpace | null;
}) {
  return (
    <main className="login-page">
      <Link className="login-back" href="/"><ArrowLeft size={15} /> Retour au site</Link>
      <div className="login-card">
        <Link className="brand login-brand" href="/">
          <Image className="brand-logo" src={logoUrl} alt="DATASYS — Société de Services Numériques" width={625} height={320} priority unoptimized />
        </Link>
        <span className="section-kicker"><ShieldCheck size={15} /> ESPACE DE PUBLICATION</span>
        <h1>Ravi de vous<br /><em>revoir.</em></h1>
        <p className="login-intro">Connectez-vous pour gérer les actualités et les activités DATASYS.</p>
        <LoginForm space={space} />
        <p className="login-help"><CircleHelp size={15} /> Besoin d’un accès ? Contactez votre administrateur.</p>
      </div>
      <aside className="login-aside" aria-label="À propos de votre espace sécurisé">
        <div className="login-aside-mark" aria-hidden="true">
          <Image src="/datasys-mark.png" alt="" width={230} height={264} unoptimized />
        </div>
        <div className="login-aside-caption">
          <span className="login-aside-caption-kicker"><Sparkles size={15} /> ESPACE DATASYS</span>
          <strong>L’innovation numérique,<br />au cœur de nos activités.</strong>
          <span className="login-aside-security"><LockKeyhole size={14} /> Accès réservé aux équipes autorisées</span>
        </div>
      </aside>
    </main>
  );
}
