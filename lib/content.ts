import "server-only";

import type {
  ActivityStatus,
  ContentStatus,
} from "@/prisma/generated/client/client";
import { prisma } from "@/lib/prisma";
import {
  mapActivity,
  mapAnnouncement,
  mapArticle,
  mapMedia,
  mapProject,
} from "@/lib/publication-mappers";

export type Section =
  | "actualites"
  | "activites"
  | "annonces"
  | "projets"
  | "galerie";

export type PublicationCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string | null;
  previewImage?: string | null;
  category: string;
  date: string;
  location?: string;
  endDate?: string | null;
  status?: ActivityStatus | ContentStatus;
  audience?: string | null;
  informationGroups?: { title: string; items: string[] }[];
  linkHref?: string | null;
  linkLabel?: string | null;
};

export const sectionNames: Record<Section, string> = {
  actualites: "Actualités",
  activites: "Activités",
  annonces: "Annonces",
  projets: "Projets",
  galerie: "Galerie",
};

export async function getPublications(section: Section): Promise<PublicationCard[]> {
  const now = new Date();

  if (section === "actualites") {
    const items = await prisma.article.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: now } },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
    });
    return items.map(mapArticle);
  }

  if (section === "activites") {
    const items = await prisma.activity.findMany({
      where: { publicationStatus: "PUBLISHED" },
      orderBy: { startDate: "asc" },
    });
    return items.map(mapActivity);
  }

  if (section === "annonces") {
    const items = await prisma.announcement.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { publishedAt: "desc" },
    });
    return items.map(mapAnnouncement);
  }

  if (section === "projets") {
    const items = await prisma.project.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: now } },
      orderBy: { publishedAt: "desc" },
    });
    return items.map(mapProject);
  }

  const items = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
  });
  return items.map(mapMedia);
}

export async function getLatestArticles(limit = 3) {
  return prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    include: { category: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function getUpcomingActivities(limit = 3) {
  const now = new Date();
  return prisma.activity.findMany({
    where: {
      publicationStatus: "PUBLISHED",
      OR: [
        { status: "UPCOMING", startDate: { gte: now } },
        { status: "ONGOING", OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    orderBy: { startDate: "asc" },
    take: limit,
  });
}
