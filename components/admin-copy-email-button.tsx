"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function AdminCopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setError(false);
    } catch {
      setCopied(false);
      setError(true);
    }
  }

  return (
    <>
      <button className="message-copy-email" type="button" onClick={copyEmail}>
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "Copié" : "Copier"}
      </button>
      {error && <span className="message-copy-error" role="alert">Copie impossible</span>}
    </>
  );
}
