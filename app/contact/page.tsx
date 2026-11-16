import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";
import {
  ArrowUpRight,
  Building2,
  Check,
  Clock3,
  CreditCard,
  Headset,
  Lightbulb,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { ContactLocationLink } from "@/components/contact-location-link";
import { SiteLayout } from "@/components/site-layout";
import { getSitePhones, getSiteSettings } from "@/lib/site-info";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l’équipe DATASYS pour parler de votre projet numérique.",
};

export const instant = false;

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const phones = getSitePhones(settings);

  return (
    <SiteLayout>
      <ViewTransition enter="auto" exit="auto" default="none">
      <section className="page-hero contact-hero">
        <div className="container contact-hero-layout">
          <div className="contact-hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> <Sparkles size={14} aria-hidden="true" /> Parlons de votre projet</span>
            <h1>Une idée ?<br /><em>Écrivons la suite.</em></h1>
            <p>Notre équipe est à votre écoute pour échanger sur vos besoins et vos ambitions.</p>
            <div className="contact-hero-actions">
              <Link className="button button-primary" href="#contact-form">Présenter mon projet <ArrowUpRight size={16} /></Link>
              <span className="contact-hero-promises">
                <span><Headset size={15} aria-hidden="true" /> Une équipe à votre écoute</span>
                <span><Clock3 size={15} aria-hidden="true" /> Réponse dans les meilleurs délais</span>
                <span><ShieldCheck size={15} aria-hidden="true" /> Échange confidentiel</span>
              </span>
            </div>
            <div className="breadcrumb"><Link href="/">Accueil</Link><span>/</span><strong>Contact</strong></div>
          </div>
          <div className="contact-hero-art" aria-hidden="true">
            <span className="contact-hero-orbit contact-hero-orbit-one" />
            <span className="contact-hero-orbit contact-hero-orbit-two" />
            <span className="contact-hero-float-icon contact-hero-float-message"><MessageCircle size={20} /></span>
            <span className="contact-hero-float-icon contact-hero-float-idea"><Lightbulb size={19} /></span>
            <div className="contact-hero-art-card">
              <span className="contact-hero-art-kicker"><i /> DATASYS · ÉCHANGE</span>
              <strong>D.</strong>
              <span className="contact-hero-art-rule" />
              <span className="contact-hero-art-caption">Vos idées ouvrent<br />de nouvelles perspectives.</span>
              <div className="contact-hero-art-tags">
                <span><Headset size={13} /> Écoute</span>
                <span><Lightbulb size={13} /> Conseil</span>
                <span><Sparkles size={13} /> Innovation</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section contact-section">
        <div className="container contact-grid">
          <div className="contact-details">
            <span className="section-kicker contact-section-kicker"><Sparkles size={14} aria-hidden="true" /> VOTRE PROCHAIN PAS</span>
            <h2>Construisons quelque chose <em>d’utile.</em></h2>
            <p>Décrivez-nous votre projet ou posez-nous votre question. Nous reviendrons vers vous dans les meilleurs délais.</p>
            {settings.contactEmail && <a className="contact-detail" href={`mailto:${settings.contactEmail}`}><span><Mail size={18} /></span><span><small>Écrivez-nous</small><strong>{settings.contactEmail}</strong></span><ArrowUpRight size={17} /></a>}
            {settings.location && <ContactLocationLink location={settings.location} latitude={settings.locationLatitude} longitude={settings.locationLongitude} />}
            {phones.length > 0 && <div className="contact-detail contact-phones"><span><Phone size={18} /></span><span><small>Appelez-nous</small>{phones.map((phone) => <a key={phone.href} href={phone.href}>{phone.display}</a>)}</span></div>}
            <div className="contact-legal">
              <div><Building2 size={17} /><span><small>{settings.legalName}</small>{settings.registration && <strong><Check size={13} aria-hidden="true" /> RCM : {settings.registration}</strong>}{settings.taxNumber && <strong><Check size={13} aria-hidden="true" /> NIF : {settings.taxNumber}</strong>}</span></div>
              {settings.bankAccount && <div><CreditCard size={17} /><span><small>Coordonnées bancaires · BNDA</small><strong>{settings.bankAccount}</strong></span></div>}
            </div>
            <div className="contact-decoration"><span>D</span><i /><i /><i /></div>
          </div>
          <ContactForm />
        </div>
      </section>
      </ViewTransition>
    </SiteLayout>
  );
}
