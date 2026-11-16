import { notFound, redirect } from "next/navigation";
import { sectionNames, type Section } from "@/lib/content";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function PublicationPage({
  params,
}: {
  params: Promise<{ rubrique: string; slug: string }>;
}) {
  const { rubrique, slug } = await params;
  if (!Object.prototype.hasOwnProperty.call(sectionNames, rubrique)) notFound();
  const now = new Date();
  const exists =
    rubrique === "actualites"
      ? await prisma.article.findFirst({
          where: { slug, status: "PUBLISHED", publishedAt: { lte: now } },
          select: { id: true },
        })
      : rubrique === "activites"
        ? await prisma.activity.findFirst({
            where: { slug, publicationStatus: "PUBLISHED" },
            select: { id: true },
          })
        : rubrique === "annonces"
          ? await prisma.announcement.findFirst({
              where: {
                slug,
                status: "PUBLISHED",
                publishedAt: { lte: now },
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
              },
              select: { id: true },
            })
          : rubrique === "projets"
            ? await prisma.project.findFirst({
                where: { slug, status: "PUBLISHED", publishedAt: { lte: now } },
                select: { id: true },
              })
            : await prisma.media.findUnique({ where: { id: slug }, select: { id: true } });
  if (!exists) notFound();
  redirect(`/${rubrique as Section}#${slug}`);
}
