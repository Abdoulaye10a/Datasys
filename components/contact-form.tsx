"use client";

import { useActionState } from "react";
import {
  AtSign,
  BriefcaseBusiness,
  MessageSquareText,
  Send,
  UserRound,
} from "lucide-react";
import { sendContactMessage, type ContactState } from "@/app/contact/actions";

const initialState: ContactState = {};

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, initialState);

  return (
    <form id="contact-form" className="contact-form" action={action} aria-label="Envoyer un message à DATASYS">
      <div className="contact-form-heading">
        <div>
          <span className="section-kicker">UN PREMIER ÉCHANGE</span>
          <h2>Parlons de votre projet<em>.</em></h2>
          <p>Quelques lignes suffisent pour nous expliquer votre besoin.</p>
        </div>
        <span className="contact-form-heading-icon"><MessageSquareText size={21} aria-hidden="true" /></span>
      </div>
      <div className="form-row">
        <label>
          <span className="contact-field-label"><UserRound size={14} aria-hidden="true" /> Votre nom</span>
          <span className="contact-input-wrap">
            <UserRound size={17} aria-hidden="true" />
            <input name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Ex. Aïssata Traoré" />
          </span>
        </label>
        <label>
          <span className="contact-field-label"><AtSign size={14} aria-hidden="true" /> Adresse e-mail</span>
          <span className="contact-input-wrap">
            <AtSign size={17} aria-hidden="true" />
            <input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="vous@entreprise.com" />
          </span>
        </label>
      </div>
      <label>
        <span className="contact-field-label"><BriefcaseBusiness size={14} aria-hidden="true" /> Sujet</span>
        <span className="contact-input-wrap">
          <BriefcaseBusiness size={17} aria-hidden="true" />
          <input name="subject" required minLength={3} maxLength={140} placeholder="Comment pouvons-nous vous aider ?" />
        </span>
      </label>
      <label>
        <span className="contact-field-label"><MessageSquareText size={14} aria-hidden="true" /> Votre message</span>
        <span className="contact-textarea-wrap">
          <MessageSquareText size={17} aria-hidden="true" />
          <textarea name="message" required minLength={10} maxLength={4000} rows={6} placeholder="Présentez-nous votre projet, votre question ou votre besoin..." />
        </span>
      </label>
      <label className="honeypot" aria-hidden="true">
        Ne pas remplir
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {state.error && <p className="form-feedback error" role="alert">{state.error}</p>}
      {state.success && <p className="form-feedback success" role="status">{state.success}</p>}
      <button className="button button-primary" type="submit" disabled={pending} aria-busy={pending}>
        <span aria-live="polite">{pending ? "Envoi en cours..." : "Envoyer mon message"}</span>
        <Send size={16} aria-hidden="true" />
      </button>
      <p className="form-note">Vos informations sont utilisées uniquement pour répondre à votre demande.</p>
    </form>
  );
}
