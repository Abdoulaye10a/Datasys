import type { UserRole } from "@/prisma/generated/client/client";

export type AdminSpace = "admin" | "editor";

export function getAdminPath(path: string, role: UserRole) {
  const prefix = role === "ADMIN" ? "/espace-admin" : "/espace-redacteur";
  return `${prefix}${path.replace(/^\/admin/, "")}`;
}
