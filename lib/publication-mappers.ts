import type {
  ActivityStatus,
  ContentStatus,
} from "@/prisma/generated/client/client";
import type { PublicationCard } from "@/lib/content";

type ArticleRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  linkHref: string | null;
  linkLabel: string | null;
  image: string | null;
  previewImage?: string | null;
  status: ContentStatus;
  publishedAt: Date | null;
  createdAt: Date;
  category?: { name: string } | null;
};

type ActivityRecord = {
  id: string;
  title: string;
  slug: string;
  description: string;
  startDate: Date;
  endDate: Date | null;
  location: string;
  linkHref: string | null;
  linkLabel: string | null;
  image: string | null;
  previewImage?: string | null;
  status: ActivityStatus;
};

type AnnouncementRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  linkHref: string | null;
  linkLabel: string | null;
  image: string | null;
  previewImage?: string | null;
  status: ContentStatus;
  publishedAt: Date | null;
  createdAt: Date;
};

type ProjectRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  category: string | null;
  audience: string | null;
  firstGroupTitle: string | null;
  firstGroupItems: string | null;
  secondGroupTitle: string | null;
  secondGroupItems: string | null;
  linkHref: string | null;
  linkLabel: string | null;
  projectDate: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  image: string | null;
  previewImage?: string | null;
  status: ContentStatus;
};

type MediaRecord = {
  id: string;
  url: string;
  previewImage?: string | null;
  altText: string | null;
  createdAt: Date;
};

export function activityCategory(status: ActivityStatus) {
  return status === "COMPLETED"
    ? "Terminée"
    : status === "ONGOING"
      ? "En cours"
      : "À venir";
}

export function mapArticle(item: ArticleRecord): PublicationCard {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    content: item.content,
    linkHref: item.linkHref ?? null,
    linkLabel: item.linkLabel ?? null,
    image: item.image,
    previewImage: item.previewImage ?? null,
    category: item.category?.name ?? "Actualité",
    date: (item.publishedAt ?? item.createdAt).toISOString(),
    status: item.status,
  };
}

export function mapActivity(item: ActivityRecord): PublicationCard {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    excerpt: item.description,
    content: item.description,
    linkHref: item.linkHref ?? null,
    linkLabel: item.linkLabel ?? null,
    image: item.image,
    previewImage: item.previewImage ?? null,
    category: activityCategory(item.status),
    date: item.startDate.toISOString(),
    location: item.location,
    endDate: item.endDate?.toISOString() ?? null,
    status: item.status,
  };
}

export function mapAnnouncement(item: AnnouncementRecord): PublicationCard {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt ?? item.content.slice(0, 180),
    content: item.content,
    linkHref: item.linkHref ?? null,
    linkLabel: item.linkLabel ?? null,
    image: item.image,
    previewImage: item.previewImage ?? null,
    category: "Communiqué",
    date: (item.publishedAt ?? item.createdAt).toISOString(),
    status: item.status,
  };
}

export function mapProject(item: ProjectRecord): PublicationCard {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    content: item.description,
    image: item.image,
    previewImage: item.previewImage ?? null,
    category: item.category ?? "Réalisation",
    date: (item.projectDate ?? item.publishedAt ?? item.createdAt).toISOString(),
    status: item.status,
    audience: item.audience,
    informationGroups: [
      { title: item.firstGroupTitle, items: item.firstGroupItems },
      { title: item.secondGroupTitle, items: item.secondGroupItems },
    ]
      .filter(
        (group): group is { title: string; items: string } =>
          Boolean(group.title && group.items),
      )
      .map(({ title, items }) => ({
        title,
        items: items.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
      })),
    linkHref: item.linkHref ?? null,
    linkLabel: item.linkLabel ?? null,
  };
}

export function mapMedia(item: MediaRecord): PublicationCard {
  return {
    id: item.id,
    title: item.altText ?? "Activité DATASYS",
    slug: item.id,
    excerpt: item.altText ?? "Un moment de la vie de DATASYS.",
    content: item.altText ?? "Un moment de la vie de DATASYS.",
    image: item.url,
    previewImage: item.previewImage ?? null,
    category: "Galerie",
    date: item.createdAt.toISOString(),
  };
}
