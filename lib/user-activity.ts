import "server-only";

import type { Session } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function recordUserActivity(
  session: Pick<Session, "userId" | "name" | "email">,
  action: string,
  details: string,
) {
  await prisma.userActivity.create({
    data: {
      actorId: session.userId,
      actorName: session.name,
      actorEmail: session.email,
      action,
      details,
    },
  });
}
