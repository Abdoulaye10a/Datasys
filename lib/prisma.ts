import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/generated/client/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL doit être défini pour accéder à PostgreSQL.");
}

// En production serverless, plusieurs instances peuvent démarrer en parallèle :
// limiter le pool évite de saturer les connexions PostgreSQL.
const adapter = new PrismaPg({
  connectionString,
  max: process.env.VERCEL ? 5 : 10,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
