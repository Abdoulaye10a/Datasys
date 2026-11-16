import Link from "next/link";
import Image from "next/image";
import { ViewTransition } from "react";
import { connection } from "next/server";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Code2,
  Compass,
  Lightbulb,
  MapPin,
  MessageCircle,
  MoveUpRight,
  Newspaper,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { Reveal } from "@/components/reveal";
import { HeroParallax } from "@/components/hero-parallax";
import { Magnetic } from "@/components/magnetic";
import { getLatestArticles, getUpcomingActivities } from "@/lib/content";
import { getSiteSettings } from "@/lib/site-info";

export const instant = false;

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function Home() {
  await connection();
  const [articles, activities, settings] = await Promise.all([
    getLatestArticles(3),
    getUpcomingActivities(2),
    getSiteSettings(),
  ]);
  const featured = articles[0];
  const homeSections = [
    { key: "news", visible: settings.homeShowNews === "true", order: Number(settings.homeNewsOrder) },
    { key: "approach", visible: settings.homeShowApproach === "true", order: Number(settings.homeApproachOrder) },
    { key: "activities", visible: settings.homeShowActivities === "true", order: Number(settings.homeActivitiesOrder) },
    { key: "cta", visible: settings.homeShowCta === "true", order: Number(settings.homeCtaOrder) },
  ]
    .filter((section) => section.visible)
    .map((section) => ({ ...section, order: Number.isFinite(section.order) ? section.order : 0 }))
    .sort((first, second) => first.order - second.order);
  const sectionNumber = (key: string) =>
    String(homeSections.findIndex((section) => section.key === key) + 2).padStart(2, "0");
  const sectionCount = String(homeSections.length + 1).padStart(2, "0");

  return (
    <SiteLayout>
      <ViewTransition enter="auto" exit="auto" default="none">
      <section className="hero">
        <HeroParallax />
        {settings.homeHeroImageUrl && (
          <Image className="hero-background-image" src={settings.homeHeroImageUrl} alt="" fill priority unoptimized />
        )}
        <div className="hero-grid-lines" />
        <div className="container hero-content">
          <div className="hero-text">
            <span className="eyebrow eyebrow-light"><span className="eyebrow-dot" /><Sparkles size={14} aria-hidden="true" /> {settings.homeEyebrow}</span>
            <h1>{settings.homeTitleFirst}<br />{settings.homeTitleBridge} <em>{settings.homeTitleEmphasis}</em><br />{settings.homeTitleLast}</h1>
            <p>{settings.homeDescription}</p>
            <div className="hero-actions">
              <Magnetic>
                <Link className="button button-gold" href={settings.homePrimaryHref}>{settings.homePrimaryLabel} <ArrowUpRight size={17} /></Link>
              </Magnetic>
              <Link className="hero-link" href={settings.homeSecondaryHref}><Newspaper size={16} /> {settings.homeSecondaryLabel} <ArrowRight size={16} /></Link>
            </div>
            <div className="hero-proof-points">
              <span><Target size={15} /> Des solutions adaptées</span>
              <span><BadgeCheck size={15} /> Un accompagnement dédié</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="hero-core"><Image src="/datasys-mark.png" alt="" width={230} height={264} unoptimized /></div>
            <div className="hero-note note-one"><Sparkles size={16} /><span>Idées qui innovent</span></div>
            <div className="hero-note note-two"><Code2 size={16} /><span>Solutions utiles</span></div>
          </div>
          <div className="hero-bottom">
            <span><ArrowRight size={13} /> Scroll pour découvrir</span>
            <span className="hero-bottom-line" />
            <span><Sparkles size={13} /> 01 / {sectionCount}</span>
          </div>
        </div>
      </section>

      <section className="intro-band">
        <span className="intro-watermark" aria-hidden="true">01</span>
        <Reveal className="container intro-grid">
          <span className="section-kicker"><Compass size={15} aria-hidden="true" /> {settings.homeIntroKicker}</span>
          <h2><span className="intro-heading-icon"><Lightbulb size={21} aria-hidden="true" /></span>{settings.homeIntroTitle}</h2>
          <div>
            <p>{settings.homeIntroText}</p>
            <Link className="text-link" href="/contact"><MessageCircle size={15} /> Faisons connaissance <ArrowUpRight size={16} /></Link>
          </div>
        </Reveal>
      </section>

      <div className="home-custom-sections">
      {settings.homeShowNews === "true" && <div className="home-custom-section" style={{ order: Number(settings.homeNewsOrder) }}>
      <section className="section section-news">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-kicker"><Newspaper size={15} aria-hidden="true" /> {sectionNumber("news")} — {settings.homeNewsKicker}</span>
              <h2>{settings.homeNewsTitleLead} <em>{settings.homeNewsTitleAccent}</em></h2>
            </div>
            <Link className="outlined-link" href="/actualites">{settings.homeNewsAllLabel} <ArrowUpRight size={15} /></Link>
          </div>
          {featured ? (
            <Reveal className={`news-layout${articles.length === 1 ? " news-layout-single" : ""}`}>
              <Link className="news-feature" href="/actualites">
                <div className={`news-feature-art${featured.image ? " news-feature-art-photo" : ""}`}>
                  {featured.image ? (
                    <>
                      <Image
                        className="news-feature-photo"
                        src={featured.image}
                        alt=""
                        fill
                        unoptimized
                        sizes="(max-width: 900px) 100vw, 55vw"
                      />
                      <span className="news-feature-photo-shade" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      <span className="art-circle circle-large" />
                      <span className="art-circle circle-small" />
                      <span className="art-line" />
                      <span className="art-monogram"><Image src="/datasys-mark.png" alt="" width={230} height={264} unoptimized /></span>
                      <span className="art-float-icon"><Newspaper size={22} /></span>
                      <span className="art-float-spark"><Sparkles size={17} /></span>
                    </>
                  )}
                  <span className="art-label">{featured.category?.name ?? "Actualité"} <ArrowUpRight size={15} /></span>
                  <span className="art-feature-stamp"><span><Zap size={13} /></span> {settings.homeNewsFeaturedBadge} <i /> 01</span>
                </div>
                <div className="news-feature-copy">
                  <span className="card-date"><CalendarDays size={13} /> {dateFormat.format(featured.publishedAt ?? featured.createdAt)} <i /> <Newspaper size={13} /> {featured.category?.name ?? "Actualité"}</span>
                  <h3>{settings.homeNewsFeaturedTitle || featured.title}</h3>
                  <p>{settings.homeNewsFeaturedText || featured.excerpt}</p>
                  <span className="text-link">{settings.homeNewsFeaturedLabel} <ArrowUpRight size={15} /></span>
                </div>
              </Link>
              <div className="news-side">
                {articles.slice(1).map((article, index) => (
                  <Link className="news-side-item" href="/actualites" key={article.id}>
                    <span className="news-index"><span>0{index + 2}</span><Newspaper size={14} /></span>
                    <span className="news-side-copy">
                      <span className="card-date"><CalendarDays size={12} /> {dateFormat.format(article.publishedAt ?? article.createdAt)} <i /> {article.category?.name ?? "Actualité"}</span>
                      <strong>{article.title}</strong>
                      <span>{article.excerpt}</span>
                    </span>
                    <MoveUpRight size={17} className="news-side-arrow" />
                  </Link>
                ))}
                <Link href="/actualites" className="news-all"><Newspaper size={15} /> {settings.homeNewsExploreLabel} <ChevronRight size={16} /></Link>
              </div>
            </Reveal>
          ) : (
            <Reveal className="news-empty">
              <span className="news-empty-icon"><Image src="/datasys-mark.png" alt="" width={230} height={264} unoptimized /></span>
              <div><h3>{settings.homeNewsEmptyTitle}</h3><p>{settings.homeNewsEmptyText}</p></div>
              <Link className="text-link" href="/actualites">{settings.homeNewsExploreLabel} <ArrowUpRight size={15} /></Link>
            </Reveal>
          )}
        </div>
      </section>
      </div>}

      {settings.homeShowApproach === "true" && <div className="home-custom-section" style={{ order: Number(settings.homeApproachOrder) }}>
      <section className="values-band">
        <div className="container values-wrap">
          <div className="values-heading">
            <span className="section-kicker"><Compass size={15} aria-hidden="true" /> {sectionNumber("approach")} — NOTRE APPROCHE</span>
            <h2>Penser juste. <br /><em>Construire mieux.</em></h2>
            <p>Des expertises complémentaires, une même ambition : transformer vos enjeux en solutions concrètes.</p>
          </div>
          <Reveal className="value-cards">
            <article className="value-card"><span className="value-number">01</span><span className="value-icon"><Lightbulb size={20} /></span><span className="value-card-kicker"><Target size={12} /> Comprendre</span><h3>Conseil & stratégie</h3><p>Une vision claire et un accompagnement adapté à vos objectifs.</p><Link href="/contact" aria-label="En savoir plus sur conseil et stratégie"><ArrowUpRight size={18} /></Link></article>
            <article className="value-card"><span className="value-number">02</span><span className="value-icon"><Code2 size={20} /></span><span className="value-card-kicker"><Zap size={12} /> Concevoir</span><h3>Solutions digitales</h3><p>Annonces, BatakiPlus et CENOU KIBARU : des outils dédiés au recrutement, aux SMS et aux services étudiants.</p><Link href="/projets" aria-label="Voir nos solutions digitales"><ArrowUpRight size={18} /></Link></article>
            <article className="value-card"><span className="value-number">03</span><span className="value-icon"><Compass size={20} /></span><span className="value-card-kicker"><BadgeCheck size={12} /> Accompagner</span><h3>Innovation durable</h3><p>La technologie au service d’un impact positif et pérenne.</p><Link href="/activites" aria-label="Découvrir nos activités"><ArrowUpRight size={18} /></Link></article>
          </Reveal>
        </div>
      </section>
      </div>}

      {settings.homeShowActivities === "true" && <div className="home-custom-section" style={{ order: Number(settings.homeActivitiesOrder) }}>
      <section className="section section-events">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-kicker"><CalendarDays size={15} aria-hidden="true" /> {sectionNumber("activities")} — RENDEZ-VOUS</span>
              <h2>À inscrire <em>à l’agenda.</em></h2>
            </div>
            <Link className="outlined-link" href="/activites">Toutes nos activités <ArrowUpRight size={15} /></Link>
          </div>
          {activities.length ? (
            <Reveal className="event-list">
              {activities.map((activity) => (
                <Link className="event-row" href="/activites" key={activity.id}>
                  <span className="event-date"><CalendarDays size={15} /><strong>{new Intl.DateTimeFormat("fr-FR", { day: "2-digit" }).format(activity.startDate)}</strong><span>{new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(activity.startDate)}</span></span>
                  <span className="event-info"><span className="event-label"><span className="event-status-dot" /> {activity.status === "ONGOING" ? "En cours" : "À venir"}</span><strong>{activity.title}</strong><span><MapPin size={13} /> {activity.location}</span></span>
                  <span className="event-excerpt">{activity.description}</span>
                  <span className="event-action"><ArrowUpRight size={19} /></span>
                </Link>
              ))}
            </Reveal>
          ) : (
            <Reveal className="events-empty">
              <CalendarDays size={21} />
              <span>Les prochaines rencontres DATASYS seront annoncées ici.</span>
              <Link className="text-link" href="/activites">Voir les activités <ArrowRight size={15} /></Link>
            </Reveal>
          )}
        </div>
      </section>
      </div>}

      {settings.homeShowCta === "true" && <div className="home-custom-section" style={{ order: Number(settings.homeCtaOrder) }}>
      <section className="closing-cta">
        <Reveal className="container closing-inner">
          <div><span className="section-kicker"><Sparkles size={15} /> UNE IDÉE EN TÊTE ?</span><h2>Et si nous la<br /><em>faisions grandir ?</em></h2></div>
          <Magnetic>
            <Link className="button button-light" href="/contact"><MessageCircle size={17} /> Échanger avec notre équipe <ArrowUpRight size={17} /></Link>
          </Magnetic>
          <span className="closing-star"><Sparkles size={24} /></span>
        </Reveal>
      </section>
      </div>}
      </div>
      </ViewTransition>
    </SiteLayout>
  );
}
