import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { UserRole } from "@/prisma/generated/client/client";
import { prisma } from "@/lib/prisma";
import { getAdminPath, type AdminSpace } from "@/lib/admin-paths";

const SESSION_COOKIE = {
  admin: "datasys_admin_session",
  editor: "datasys_editor_session",
} as const;
const SESSION_DURATION = 60 * 60 * 8;

export async function getAdminSpace(): Promise<AdminSpace | null> {
  const space = (await headers()).get("x-datasys-admin-space");
  return space === "admin" || space === "editor" ? space : null;
}

export type Session = {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  expiresAt: number;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET doit contenir au moins 32 caractères.");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export async function createSession(user: Omit<Session, "expiresAt">) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION;
  const payload = Buffer.from(JSON.stringify({ ...user, expiresAt })).toString(
    "base64url",
  );
  const cookieStore = await cookies();
  const space = user.role === "ADMIN" ? "admin" : "editor";
  const path = space === "admin" ? "/espace-admin" : "/espace-redacteur";

  cookieStore.set(SESSION_COOKIE[space], `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path,
  });
  cookieStore.set("datasys_session", "", { path: "/", maxAge: 0 });
}

export async function getSession(): Promise<Session | null> {
  await connection();
  const space = await getAdminSpace();
  if (!space) return null;
  const token = (await cookies()).get(SESSION_COOKIE[space])?.value;
  if (!token) return null;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }

  let session: Session;
  try {
    session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Session;
  } catch {
    return null;
  }

  if (
    !session.userId ||
    !session.name ||
    typeof session.email !== "string" ||
    (session.role !== "ADMIN" && session.role !== "EDITOR") ||
    (space === "admin" && session.role !== "ADMIN") ||
    (space === "editor" && session.role !== "EDITOR") ||
    !Number.isInteger(session.expiresAt) ||
    session.expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, isBlocked: true },
  });
  if (!user || user.isBlocked) return null;
  return {
    ...session,
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    const space = await getAdminSpace();
    redirect(space === "admin" ? "/espace-admin/login" : space === "editor" ? "/espace-redacteur/login" : "/admin/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.role !== "ADMIN") {
    redirect(getAdminPath("/admin?error=forbidden", session.role));
  }
  return session;
}

export async function clearSession() {
  const space = await getAdminSpace();
  if (space) {
    const path = space === "admin" ? "/espace-admin" : "/espace-redacteur";
    (await cookies()).set(SESSION_COOKIE[space], "", { path, maxAge: 0 });
  }
}
