"use client";

import { useActionState, useState } from "react";
import { BriefcaseBusiness, KeyRound, Mail, ShieldCheck, UserPlus, UserRound } from "lucide-react";
import { createUserAction, type CreateUserState } from "@/app/admin/actions";
import { PasswordField } from "@/components/password-field";

const initialState: CreateUserState = {};

export function AdminCreateUserForm() {
  const [state, action, pending] = useActionState(createUserAction, initialState);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "EDITOR">("EDITOR");

  return (
    <form className="admin-form" action={action}>
      {state.error && <p className="form-feedback error" role="alert">{state.error}</p>}
      <label>
        <span className="user-form-field-label"><UserRound size={16} /> Nom complet</span>
        <input name="name" value={name} onChange={(event) => setName(event.currentTarget.value)} required minLength={2} maxLength={80} />
      </label>
      <label>
        <span className="user-form-field-label"><Mail size={16} /> Adresse e-mail</span>
        <input type="email" name="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required maxLength={254} autoComplete="off" />
      </label>
      <PasswordField
        id="new-user-password"
        label={<><KeyRound size={16} /> Mot de passe initial</>}
        name="password"
        autoComplete="new-password"
        leadingIcon={<KeyRound size={17} />}
        value={password}
        onValueChange={setPassword}
        required
        minLength={12}
        hint="Au moins 12 caractères. Transmettez-le de façon sécurisée."
      />
      <label>
        <span className="user-form-field-label">
          {role === "ADMIN" ? <ShieldCheck size={16} /> : <BriefcaseBusiness size={16} />}
          Rôle
        </span>
        <select name="role" value={role} onChange={(event) => setRole(event.currentTarget.value as "ADMIN" | "EDITOR")}>
          <option value="EDITOR">Rédacteur</option>
          <option value="ADMIN">Administrateur</option>
        </select>
      </label>
      <button className="button button-primary" type="submit" disabled={pending}><UserPlus size={16} /> {pending ? "Création…" : "Créer l’accès"}</button>
    </form>
  );
}