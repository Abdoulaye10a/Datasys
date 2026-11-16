import type { MetadataRoute } from "next";
import { connection } from "next/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();
  const staticPages = ["", "actualites", "activites", "annonces", "projets", "galerie", "contact"];

  return staticPages.map((path) => ({
    url: `${baseUrl}/${path}`,
    lastModified: now,
    changeFrequency: path ? ("weekly" as const) : ("daily" as const),
    priority: path ? 0.7 : 1,
  }));
}
