"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordStrength = {
  score: number;
  label: string;
};

type PasswordFieldProps = {
  id: string;
  label: ReactNode;
  name: string;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  hint?: string;
  leadingIcon?: ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
};

function getPasswordStrength(password: string): PasswordStrength | null {
  if (!password) return null;

  const score = [
    password.length >= 8,
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  const label =
    score <= 1
      ? "Très faible"
      : score === 2
        ? "Faible"
        : score === 3
          ? "Moyen"
          : score === 4
            ? "Bon"
            : "Très bon";

  return { score, label };
}

export function PasswordField({
  id,
  label,
  name,
  autoComplete,
  required = false,
  minLength,
  maxLength = 128,
  hint,
  leadingIcon,
  value,
  onValueChange,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  function updateStrength(event: ChangeEvent<HTMLInputElement>) {
    setStrength(getPasswordStrength(event.currentTarget.value));
  }

  return (
    <div className="password-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrap">
        {leadingIcon && <span className="password-input-icon" aria-hidden="true">{leadingIcon}</span>}
        <input
          id={id}
          type={visible ? "text" : "password"}
          name={name}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          value={value}
          onChange={(event) => {
            updateStrength(event);
            onValueChange?.(event.currentTarget.value);
          }}
          aria-describedby={`${id}-strength${hint ? ` ${id}-hint` : ""}`}
        />
        <button
          className="password-visibility"
          type="button"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-controls={id}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
          <span>{visible ? "Masquer" : "Afficher"}</span>
        </button>
      </div>
      <div className={`password-strength${strength ? ` is-active strength-${strength.score}` : ""}`}>
        <div className="password-strength-bars" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={strength && index < strength.score ? "is-filled" : ""} />
          ))}
        </div>
        <span id={`${id}-strength`} aria-live="polite">
          {strength ? `Robustesse : ${strength.label}` : "La robustesse s’affichera ici"}
        </span>
      </div>
      {hint && <small className="field-hint" id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
