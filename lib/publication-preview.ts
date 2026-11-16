import "server-only";

import type { Session } from "@/lib/auth";
import type { PublicationCard, Section } from "@/lib/content";
import { prisma } from "@/lib/prisma";
import {
  mapActivity,
  mapAnnouncement,
  mapArticle,
  mapMedia,
  mapProject,
} from "@/lib/publication-mappers";

const publicationSections: Section[] = [
  "actualites",
  "activites",
  "annonces",
  "projets",
  "galerie",
];

export function isPublicationSection(value: string): value is Section {
  return publicationSections.includes(value as Section);
}

export type PublicationPreview = {
  card: PublicationCard;
  published: boolean;
};

export async function getPublicationPreview(
  section: Section,
  id: string,
  session: Session,
): Promise<PublicationPreview | null> {
  const now = new Date();
  const ownContent =
    session.role === "ADMIN" ? {} : { authorId: session.userId };

  if (section === "actualites") {
    const item = await prisma.article.findFirst({
      where: { id, ...ownContent },
      include: { category: true },
    });
    if (!item) return null;
    return {
      card: mapArticle(item),
      published:
        item.status === "PUBLISHED" &&
        item.publishedAt !== null &&
        item.publishedAt <= now,
    };
  }

  if (section === "activites") {
    const item = await prisma.activity.findFirst({
      where: { id, ...ownContent },
    });
    if (!item) return null;
    return {
      card: mapActivity(item),
      published: item.publicationStatus === "PUBLISHED",
    };
  }

  if (section === "annonces") {
    const item = await prisma.announcement.findFirst({
      where: { id, ...ownContent },
    });
    if (!item) return null;
    return {
      card: mapAnnouncement(item),
      published:
        item.status === "PUBLISHED" &&
        item.publishedAt !== null &&
        item.publishedAt <= now &&
        (item.expiresAt === null || item.expiresAt > now),
    };
  }

  if (section === "projets") {
    const item = await prisma.project.findFirst({
      where: { id, ...ownContent },
    });
    if (!item) return null;
    return {
      card: mapProject(item),
      published:
        item.status === "PUBLISHED" &&
        item.publishedAt !== null &&
        item.publishedAt <= now,
    };
  }

  const item = await prisma.media.findFirst({
    where: {
      id,
      ...(session.role === "ADMIN" ? {} : { uploadedById: session.userId }),
    },
  });
  if (!item) return null;
  return { card: mapMedia(item), published: true };
}
