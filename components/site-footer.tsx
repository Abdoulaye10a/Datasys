import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getSitePhones, type SiteSettings } from "@/lib/site-info";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const phones = getSitePhones(settings);
  const hasLegalInfo = settings.registration || settings.taxNumber || settings.bankAccount;
  const hasSocialLinks = settings.linkedinUrl || settings.instagramUrl;

  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-intro">
          <Link className="brand brand-light" href="/">
            <Image className="brand-logo" src={settings.logoUrl} alt={settings.legalName} width={625} height={320} unoptimized />
          </Link>
          <p>{settings.legalName}</p>
        </div>
        <div className="footer-links">
          <span className="footer-label">Explorer</span>
          <Link href="/actualites">Actualités</Link>
          <Link href="/activites">Nos activités</Link>
          <Link href="/projets">Nos projets</Link>
        </div>
        <div className="footer-links">
          <span className="footer-label">Restons en contact</span>
          <Link href="/contact">Nous écrire <ArrowUpRight size={14} /></Link>
          {settings.contactEmail && <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>}
          {settings.location && <span>{settings.location}</span>}
          {phones.map((phone) => <a key={phone.href} href={phone.href}>{phone.display}</a>)}
        </div>
        {(hasLegalInfo || hasSocialLinks) && <div className="footer-links footer-extra">
          {hasLegalInfo && <>
            <span className="footer-label">Informations légales</span>
            <div className="footer-legal">
              {settings.registration && <span>RCM : {settings.registration}</span>}
              {settings.taxNumber && <span>NIF : {settings.taxNumber}</span>}
              {settings.bankAccount && <span>BNDA : {settings.bankAccount}</span>}
            </div>
          </>}
          {hasSocialLinks && <div className="social-links">
            {settings.linkedinUrl && <a href={settings.linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn DATASYS"><span className="social-text">in</span></a>}
            {settings.instagramUrl && <a href={settings.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram DATASYS"><span className="social-text">ig</span></a>}
          </div>}
        </div>}
      </div>
      <div className="container footer-bottom">
        <span>© DATASYS. Tous droits réservés.</span>
      </div>
    </footer>
  );
}
