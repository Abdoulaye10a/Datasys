"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Mail, Send } from "lucide-react";
import {
  sendMessageReplyAction,
  type SendMessageReplyState,
} from "@/app/admin/actions";

const initialState: SendMessageReplyState = {};

export function AdminMessageReplyForm({
  messageId,
  recipientName,
  recipientEmail,
  subject,
  defaultSenderName,
  defaultSenderEmail,
}: {
  messageId: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  defaultSenderName: string;
  defaultSenderEmail: string;
}) {
  const [senderName, setSenderName] = useState(defaultSenderName);
  const [senderEmail, setSenderEmail] = useState(defaultSenderEmail);
  const [replyEmail, setReplyEmail] = useState(recipientEmail);
  const [replySubject, setReplySubject] = useState(`Re : ${subject}`);
  const [body, setBody] = useState("");
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="admin-form message-reply-form"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await sendMessageReplyAction(state, formData);
          setState(result);
          if (result.success) setBody("");
        });
      }}
    >
      <input type="hidden" name="messageId" value={messageId} />
      <p className="message-compose-intro">Réponse à <strong>{recipientName}</strong>. Vérifiez les adresses avant l’envoi.</p>
      <fieldset className="message-compose-fields">
        <legend>De — expéditeur</legend>
      <label>
        Nom affiché
        <input
          name="senderName"
          type="text"
          value={senderName}
          onChange={(event) => {
            setSenderName(event.currentTarget.value);
            setState(initialState);
          }}
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
        />
      </label>
      <label>
        <span className="message-reply-label"><Mail size={14} aria-hidden="true" /> Adresse d’envoi</span>
        <input
          name="senderEmail"
          type="email"
          value={senderEmail}
          onChange={(event) => {
            setSenderEmail(event.currentTarget.value);
            setState(initialState);
          }}
          autoComplete="email"
          required
          maxLength={254}
        />
      </label>
      </fieldset>
      <fieldset className="message-compose-fields">
        <legend>À — destinataire</legend>
      <label>
        <span className="message-reply-label"><Mail size={14} aria-hidden="true" /> Adresse du destinataire</span>
        <input
          name="recipientEmail"
          type="email"
          value={replyEmail}
          onChange={(event) => {
            setReplyEmail(event.currentTarget.value);
            setState(initialState);
          }}
          autoComplete="email"
          required
          maxLength={254}
        />
      </label>
      <label>
        Objet
        <input
          name="subject"
          type="text"
          value={replySubject}
          onChange={(event) => {
            setReplySubject(event.currentTarget.value);
            setState(initialState);
          }}
          required
          maxLength={200}
        />
      </label>
      </fieldset>
      <label>
        Votre réponse
        <textarea
          name="body"
          value={body}
          onChange={(event) => {
            setBody(event.currentTarget.value);
            setState(initialState);
          }}
          required
          minLength={1}
          maxLength={10000}
          rows={5}
          placeholder={`Bonjour ${recipientName},\n\n`}
        />
      </label>
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
      <div className="message-reply-actions">
        <button
          className="button button-primary"
          type="submit"
          disabled={pending}
        >
          {pending ? <LoaderCircle className="login-spinner" size={15} /> : <Send size={15} />}
          {pending ? "Envoi en cours…" : "Envoyer la réponse"}
        </button>
      </div>
      <p className="field-hint">La réponse sera envoyée par le serveur via Gmail. Pour utiliser une autre adresse, ajoutez-la comme alias vérifié dans le panneau « Configuration Gmail » ci-dessus.</p>
    </form>
  );
}
