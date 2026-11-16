import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const pageSize = 50;

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Votre session a expiré. Reconnectez-vous." }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return Response.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const pageParam = new URL(request.url).searchParams.get("page");
  const parsedPage = z.coerce.number().int().positive().safeParse(pageParam);
  if (!parsedPage.success) {
    return Response.json({ error: "Le numéro de page est invalide." }, { status: 400 });
  }

  const totalCount = await prisma.userActivity.count();
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(parsedPage.data, pageCount);
  const history = await prisma.userActivity.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return Response.json(
    {
      entries: history.map((entry) => ({
        id: entry.id,
        createdAt: entry.createdAt.toISOString(),
        formattedDate: dateFormatter.format(entry.createdAt),
        actorName: entry.actorName,
        actorEmail: entry.actorEmail,
        action: entry.action,
        details: entry.details,
      })),
      totalCount,
      page,
      pageCount,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
