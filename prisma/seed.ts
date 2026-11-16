import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client/client";
import bcrypt from "bcryptjs";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL doit être défini pour initialiser PostgreSQL.");
  }
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password || password.length < 12) {
    throw new Error(
      "Définissez ADMIN_NAME, ADMIN_EMAIL et un ADMIN_PASSWORD d'au moins 12 caractères.",
    );
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.user.upsert({
      where: { email },
      update: { name, passwordHash, role: "ADMIN" },
      create: { name, email, passwordHash, role: "ADMIN" },
    });

    const categories = [
      { name: "Innovation", slug: "innovation" },
      { name: "Entreprise", slug: "entreprise" },
      { name: "Formation", slug: "formation" },
    ];
    for (const category of categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: { name: category.name },
        create: category,
      });
    }

    await prisma.article.upsert({
      where: { slug: "bienvenue-chez-datasys" },
      update: {},
      create: {
        title: "Bienvenue chez DATASYS",
        slug: "bienvenue-chez-datasys",
        excerpt:
          "Découvrez notre vision et la manière dont nous mettons le numérique au service de vos ambitions.",
        content:
          "DATASYS accompagne les organisations dans leur transformation numérique. Nos équipes conçoivent des solutions adaptées, fiables et durables pour répondre aux enjeux de chaque métier.",
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorId: admin.id,
        categoryId: (
          await prisma.category.findUniqueOrThrow({
            where: { slug: "entreprise" },
          })
        ).id,
      },
    });

    await prisma.activity.upsert({
      where: { slug: "atelier-transformation-numerique" },
      update: {},
      create: {
        title: "Atelier de transformation numérique",
        slug: "atelier-transformation-numerique",
        description:
          "Une rencontre dédiée aux solutions numériques et aux nouvelles pratiques pour les organisations.",
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        location: "Dakar, Sénégal",
        status: "UPCOMING",
        publicationStatus: "PUBLISHED",
        authorId: admin.id,
      },
    });

    await prisma.project.upsert({
      where: { slug: "solutions-numeriques-sur-mesure" },
      update: {},
      create: {
        title: "Des solutions numériques sur mesure",
        slug: "solutions-numeriques-sur-mesure",
        excerpt:
          "Des outils pensés pour simplifier les usages et accompagner la croissance.",
        description:
          "Nous concevons des plateformes et des applications adaptées aux besoins réels des équipes, avec un accompagnement de la conception au déploiement.",
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorId: admin.id,
      },
    });

    console.log(`Administrateur prêt : ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Échec de l’initialisation des données :", error);
  process.exitCode = 1;
});
