import "server-only";

import type { PublicationType } from "@/prisma/generated/client/client";
import { prisma } from "@/lib/prisma";

export async function getPublicationViewCounts(
  publicationType: PublicationType,
  publicationIds: string[],
) {
  if (publicationIds.length === 0) return new Map<string, number>();

  const counts = await prisma.publicationView.groupBy({
    by: ["publicationId"],
    where: { publicationType, publicationId: { in: publicationIds } },
    _count: { _all: true },
  });

  return new Map(counts.map(({ publicationId, _count }) => [publicationId, _count._all]));
}