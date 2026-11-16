import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  ChevronRight,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Mail,
  MessageSquareText,
  Newspaper,
  Plus,
  Sparkles,
} from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { requireSession } from "@/lib/auth";
import { getAdminPath } from "@/lib/admin-paths";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-info";

export const instant = false;

const shortDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export default async function AdminDashboard() {
  const session = await requireSession();
  const ownArticles = session.role === "ADMIN" ? {} : { authorId: session.userId };
  const ownCollections = session.role === "ADMIN" ? {} : { authorId: session.userId };
  const [
    articles,
    drafts,
    activities,
    projects,
    messages,
    unreadMessages,
    settings,
    recentArticles,
    recentActivities,
    recentAnnouncements,
    recentProjects,
  ] = await Promise.all([
    prisma.article.count({ where: ownArticles }),
    prisma.article.count({ where: { ...ownArticles, status: "DRAFT" } }),
    prisma.activity.count({ where: ownCollections }),
    prisma.project.count({ where: ownCollections }),
    session.role === "ADMIN" ? prisma.message.count() : Promise.resolve(null),
    session.role === "ADMIN" ? prisma.message.count({ where: { readAt: null } }) : Promise.resolve(null),
    session.role === "ADMIN" ? getSiteSettings() : Promise.resolve(null),
    prisma.article.findMany({
      where: ownArticles,
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: { id: true, title: true, status: true, updatedAt: true },
    }),
    prisma.activity.findMany({
      where: ownCollections,
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, title: true, publicationStatus: true, updatedAt: true },
    }),
    prisma.announcement.findMany({
      where: ownCollections,
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, title: true, status: true, updatedAt: true },
    }),
    prisma.project.findMany({
      where: ownCollections,
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, title: true, status: true, updatedAt: true },
    }),
  ]);
  const visibleSolutions = settings
    ? [
        settings.solutionAnnoncesVisible,
        settings.solutionBatakiVisible,
        settings.solutionCenouVisible,
        settings.solutionImmoVisible,
      ].filter((visible) => visible === "true").length
    : 0;
  const projectCount = projects + visibleSolutions;
  const recentPublications = [
    ...recentArticles.map((article) => ({
      id: `article-${article.id}`,
      title: article.title,
      type: "Actualité",
      kind: "article" as const,
      published: article.status === "PUBLISHED",
      updatedAt: article.updatedAt,
      href: getAdminPath(`/admin/actualites?edit=${article.id}`, session.role),
    })),
    ...recentActivities.map((activity) => ({
      id: `activity-${activity.id}`,
      title: activity.title,
      type: "Activité",
      kind: "activity" as const,
      published: activity.publicationStatus === "PUBLISHED",
      updatedAt: activity.updatedAt,
      href: getAdminPath(`/admin/activites?edit=${activity.id}`, session.role),
    })),
    ...recentAnnouncements.map((announcement) => ({
      id: `announcement-${announcement.id}`,
      title: announcement.title,
      type: "Annonce",
      kind: "announcement" as const,
      published: announcement.status === "PUBLISHED",
      updatedAt: announcement.updatedAt,
      href: getAdminPath(`/admin/annonces?edit=${announcement.id}`, session.role),
    })),
    ...recentProjects.map((project) => ({
      id: `project-${project.id}`,
      title: project.title,
      type: "Projet",
      kind: "project" as const,
      published: project.status === "PUBLISHED",
      updatedAt: project.updatedAt,
      href: getAdminPath(`/admin/projets?edit=${project.id}`, session.role),
    })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 6);

  return (
    <AdminShell user={session}>
      <div className="admin-welcome">
        <div className="admin-welcome-copy">
          <span className="section-kicker"><LayoutDashboard size={15} /> TABLEAU DE BORD</span>
          <h1>Bonjour, {session.name.split(" ")[0]} <Sparkles size={22} aria-hidden="true" /></h1>
          <p>Voici ce qui se passe sur votre espace DATASYS.</p>
        </div>
        <Link className="button button-primary" href={getAdminPath("/admin/actualites", session.role)}><Plus size={17} /> Nouvelle actualité</Link>
      </div>
      {unreadMessages ? (
        <Link className="admin-inbox-alert" href={getAdminPath("/admin/messages", session.role)}>
          <span className="admin-inbox-alert-icon"><Mail size={19} /></span>
          <span className="admin-inbox-alert-copy">
            <strong>{unreadMessages} message{unreadMessages === 1 ? "" : "s"} non lu{unreadMessages === 1 ? "" : "s"}</strong>
            <small>Des visiteurs attendent votre réponse depuis le formulaire de contact.</small>
          </span>
          <span className="admin-inbox-alert-cta">Ouvrir la messagerie <ArrowRight size={16} /></span>
        </Link>
      ) : null}

      <div className="admin-stat-grid">
        <Link className="admin-stat" href={getAdminPath("/admin/actualites", session.role)}>
          <span className="admin-stat-icon"><Newspaper size={19} /></span>
          <span className="admin-stat-label"><Newspaper size={14} /> {session.role === "ADMIN" ? "Actualités" : "Mes actualités"}</span>
          <strong>{articles}</strong>
          <span className="admin-stat-foot"><FileText size={13} /> {drafts} brouillon{drafts === 1 ? "" : "s"} · Gérer <ArrowUpRight size={13} /></span>
        </Link>
        <Link className="admin-stat" href={getAdminPath("/admin/activites", session.role)}>
          <span className="admin-stat-icon gold"><CalendarDays size={19} /></span>
          <span className="admin-stat-label"><CalendarDays size={14} /> Activités</span>
          <strong>{activities}</strong>
          <span className="admin-stat-foot">Gérer les activités <ArrowUpRight size={13} /></span>
        </Link>
        <Link className="admin-stat" href={getAdminPath("/admin/projets", session.role)}>
          <span className="admin-stat-icon green"><FolderKanban size={19} /></span>
          <span className="admin-stat-label"><FolderKanban size={14} /> Projets</span>
          <strong>{projectCount}</strong>
          <span className="admin-stat-foot">Voir les projets <ArrowUpRight size={13} /></span>
        </Link>
        {messages !== null && unreadMessages !== null && (
          <Link className="admin-stat" href={getAdminPath("/admin/messages", session.role)}>
            <span className="admin-stat-icon purple"><Mail size={19} /></span>
            <span className="admin-stat-label"><BellRing size={14} /> Messages reçus</span>
            <strong>{messages}</strong>
            <span className="admin-stat-foot">{unreadMessages} non lu{unreadMessages === 1 ? "" : "s"} · Ouvrir <ArrowUpRight size={13} /></span>
          </Link>
        )}
      </div>

      <div className="admin-dashboard-columns">
        <section className="admin-panel admin-recent-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="section-kicker"><FileText size={14} /> ACTIVITÉ RÉCENTE</span>
              <h2><Sparkles size={19} /> Dernières publications</h2>
            </div>
          </div>
          {recentPublications.length ? (
            <ul className="admin-recent-list">
              {recentPublications.map((publication) => (
                <li key={publication.id}>
                  <Link href={publication.href}>
                    <span className={`admin-recent-icon is-${publication.kind}`} aria-hidden="true">
                      {publication.kind === "article" ? <Newspaper size={16} /> : publication.kind === "activity" ? <CalendarDays size={16} /> : publication.kind === "announcement" ? <MessageSquareText size={16} /> : <FolderKanban size={16} />}
                    </span>
                    <span className="admin-recent-copy">
                      <strong>{publication.title}</strong>
                      <small>{publication.type} · {shortDate.format(publication.updatedAt)}</small>
                    </span>
                    <span className={`status-pill ${publication.published ? "published" : "draft"}`}>{publication.published ? "Publié" : "Brouillon"}</span>
                    <ChevronRight size={16} className="admin-recent-chevron" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="admin-empty"><span>✳</span><strong>Votre espace est prêt.</strong><p>Votre première publication apparaîtra ici.</p></div>
          )}
        </section>

        <section className="admin-panel admin-dashboard-side">
          <div className="admin-panel-heading">
            <div>
              <span className="section-kicker"><Sparkles size={14} /> RACCOURCIS</span>
              <h2><FolderKanban size={19} /> Gérer les contenus</h2>
            </div>
            <Link href="/" className="admin-panel-link">Ouvrir le site <ArrowUpRight size={14} /></Link>
          </div>
          <div className="admin-quick-links admin-quick-links-stacked">
            <Link href={getAdminPath("/admin/actualites", session.role)}><span className="quick-icon"><Newspaper size={19} /></span><span><strong>Actualités</strong><small><FileText size={12} /> Rédiger et publier des articles</small></span><ArrowUpRight size={16} /></Link>
            <Link href={getAdminPath("/admin/activites", session.role)}><span className="quick-icon"><CalendarDays size={19} /></span><span><strong>Activités</strong><small><BellRing size={12} /> Événements et formations</small></span><ArrowUpRight size={16} /></Link>
            <Link href={getAdminPath("/admin/annonces", session.role)}><span className="quick-icon"><MessageSquareText size={19} /></span><span><strong>Annonces</strong><small><FileText size={12} /> Communiqués officiels</small></span><ArrowUpRight size={16} /></Link>
            <Link href={getAdminPath("/admin/projets", session.role)}><span className="quick-icon"><FolderKanban size={19} /></span><span><strong>Projets</strong><small><Sparkles size={12} /> Présenter vos réalisations</small></span><ArrowUpRight size={16} /></Link>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
