"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import type { PublicationType } from "@/prisma/generated/client/client";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-info";
import {
  projectSolutionIds,
  projectSolutionViewIds,
} from "@/lib/project-solution-view-ids";

const visitorCookie = "datasys_visitor";
const visitorCookieMaxAge = 60 * 60 * 24 * 400;
const publicationTypes = new Set<PublicationType>([
  "ARTICLE",
  "ACTIVITY",
  "ANNOUNCEMENT",
  "PROJECT",
  "MEDIA",
]);

export async function recordPublicationViews(
  type: PublicationType,
  publicationIds: string[],
) {
  if (!publicationTypes.has(type)) {
    throw new Error("Le type de publication est invalide.");
  }
  if (
    !Array.isArray(publicationIds) ||
    publicationIds.length > 500 ||
    publicationIds.some((id) => typeof id !== "string" || id.length === 0 || id.length > 128)
  ) {
    throw new Error("La liste des publications à comptabiliser est invalide.");
  }
  if (publicationIds.length === 0) return;

  const uniqueIds = [...new Set(publicationIds)];
  const now = new Date();
  const publishedItems =
    type === "ARTICLE"
      ? await prisma.article.findMany({
          where: {
            id: { in: uniqueIds },
            status: "PUBLISHED",
            publishedAt: { lte: now },
          },
          select: { id: true },
        })
      : type === "ACTIVITY"
        ? await prisma.activity.findMany({
            where: { id: { in: uniqueIds }, publicationStatus: "PUBLISHED" },
            select: { id: true },
          })
        : type === "ANNOUNCEMENT"
          ? await prisma.announcement.findMany({
              where: {
                id: { in: uniqueIds },
                status: "PUBLISHED",
                publishedAt: { lte: now },
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
              },
              select: { id: true },
            })
          : type === "PROJECT"
            ? await (async () => {
                const projects = await prisma.project.findMany({
                  where: {
                    id: { in: uniqueIds },
                    status: "PUBLISHED",
                    publishedAt: { lte: now },
                  },
                  select: { id: true },
                });
                const requestedSolutionIds = projectSolutionIds.filter((solution) =>
                  uniqueIds.includes(projectSolutionViewIds[solution]),
                );
                if (requestedSolutionIds.length === 0) return projects;

                const settings = await getSiteSettings();
                const publishedSolutions = requestedSolutionIds
                  .filter((solution) => {
                    const settingKeys = ({
                      annonces: {
                        visible: "solutionAnnoncesVisible",
                        status: "solutionAnnoncesStatus",
                      },
                      bataki: {
                        visible: "solutionBatakiVisible",
                        status: "solutionBatakiStatus",
                      },
                      cenou: {
                        visible: "solutionCenouVisible",
                        status: "solutionCenouStatus",
                      },
                      immo: {
                        visible: "solutionImmoVisible",
                        status: "solutionImmoStatus",
                      },
                    } as const)[solution];
                    return (
                      settings[settingKeys.visible] === "true" &&
                      settings[settingKeys.status] === "PUBLISHED"
                    );
                  })
                  .map((solution) => ({ id: projectSolutionViewIds[solution] }));

                return [...projects, ...publishedSolutions];
              })()
            : await prisma.media.findMany({
                where: { id: { in: uniqueIds } },
                select: { id: true },
              });

  if (publishedItems.length === 0) return;

  const cookieStore = await cookies();
  let visitorId = cookieStore.get(visitorCookie)?.value;
  if (!visitorId) {
    visitorId = randomUUID();
    cookieStore.set(visitorCookie, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: visitorCookieMaxAge,
    });
  }

  await prisma.publicationView.createMany({
    data: publishedItems.map(({ id }) => ({
      publicationType: type,
      publicationId: id,
      visitorId,
    })),
    skipDuplicates: true,
  });
}