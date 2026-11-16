"use server";

import { compare, hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  getGmailConfiguration,
  saveGmailConfiguration,
  sendGmailMessage,
  verifyGmailConfiguration,
} from "@/lib/gmail";
import {
  clearSession,
  createSession,
  getAdminSpace,
  requireAdmin,
  requireSession,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultSiteSettings } from "@/lib/site-info";
import { siteLogoOptions } from "@/lib/site-logos";
import { recordUserActivity } from "@/lib/user-activity";
import { getAdminPath } from "@/lib/admin-paths";
import {
  defaultButtonHref,
  defaultButtonLabel,
  getPublicationButtonFields,
} from "@/lib/publication-button";

const imageFileExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function saveContentImage(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) return null;

  const extension = imageFileExtensions[value.type];
  if (!extension) throw new Error("Format non pris en charge. Utilisez JPEG, PNG ou WebP.");
  if (value.size > 5 * 1024 * 1024) throw new Error("L’image ne doit pas dépasser 5 Mo.");

  const buffer = Buffer.from(await value.arrayBuffer());
  const validSignature =
    (value.type === "image/jpeg" && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) ||
    (value.type === "image/png" && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (value.type === "image/webp" && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP");
  if (!validSignature) throw new Error("Le fichier n’est pas une image valide de ce format.");

  const filename = `${randomUUID()}.${extension}`;
  const filePath = join(process.cwd(), "public", "uploads", filename);
  await mkdir(join(process.cwd(), "public", "uploads"), { recursive: true });
  await writeFile(filePath, buffer, { flag: "wx" });
  return { filePath, url: `/uploads/${filename}` };
}

const siteImageSettingKeys = [
  "logoUrl",
  "homeHeroImageUrl",
  "solutionAnnoncesImage",
  "solutionAnnoncesPreviewImage",
  "solutionBatakiImage",
  "solutionBatakiPreviewImage",
  "solutionCenouImage",
  "solutionCenouPreviewImage",
  "solutionImmoImage",
  "solutionImmoPreviewImage",
];

async function removeUnusedContentImage(imageUrl: string | null | undefined) {
  if (!imageUrl?.startsWith("/uploads/")) return;

  const filename = basename(imageUrl);
  if (filename !== imageUrl.slice("/uploads/".length) || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(filename)) {
    return;
  }

  try {
    const [mediaReference, settingReference] = await Promise.all([
      prisma.media.findFirst({
        where: { OR: [{ url: imageUrl }, { previewImage: imageUrl }] },
        select: { id: true },
      }),
      prisma.setting.findFirst({ where: { value: imageUrl }, select: { key: true } }),
    ]);
    if (mediaReference || settingReference) return;

    await unlink(join(process.cwd(), "public", "uploads", filename)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  } catch (error) {
    console.error("Impossible de supprimer une image de contenu devenue inutilisée.", error);
  }
}

async function cleanupFailedContentImages(
  uploads: Array<Awaited<ReturnType<typeof saveContentImage>>>,
  error: unknown,
): Promise<never> {
  for (const upload of uploads) {
    if (!upload) continue;
    try {
      await unlink(upload.filePath);
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Impossible d’enregistrer le contenu et de nettoyer son image temporaire.",
      );
    }
  }
  throw error;
}

export type LoginState = {
  error?: string;
  lockoutUntil?: number;
  email?: string;
  role?: "ADMIN" | "EDITOR";
  attempt?: number;
};

const loginWindowMs = 15 * 60_000;
const maxLoginAttempts = 5;

function loginErrorState(
  previousState: LoginState,
  formData: FormData,
  error: string,
  lockoutUntil?: number,
): LoginState {
  const email = formData.get("email");
  const role = formData.get("role");
  return {
    error,
    lockoutUntil,
    email: typeof email === "string" ? email.slice(0, 254) : "",
    role: role === "ADMIN" || role === "EDITOR" ? role : undefined,
    attempt: (previousState.attempt ?? 0) + 1,
  };
}

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
  role: z.enum(["ADMIN", "EDITOR"]),
});

async function getLoginLockoutUntil(email: string) {
  const attempts = await prisma.loginAttempt.findMany({
    where: {
      email,
      createdAt: { gte: new Date(Date.now() - loginWindowMs) },
    },
    orderBy: { createdAt: "asc" },
    take: maxLoginAttempts,
    select: { createdAt: true },
  });

  if (attempts.length < maxLoginAttempts) return undefined;

  const unlockAt = attempts[0].createdAt.getTime() + loginWindowMs;
  return unlockAt > Date.now() ? unlockAt : undefined;
}

export async function loginAction(
  previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return loginErrorState(
      previousState,
      formData,
      "Adresse e-mail ou mot de passe invalide.",
    );
  }
  const space = await getAdminSpace();
  if (space && parsed.data.role !== (space === "admin" ? "ADMIN" : "EDITOR")) {
    return loginErrorState(
      previousState,
      formData,
      "Le type de compte ne correspond pas à cet espace.",
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const attemptsSince = new Date(Date.now() - loginWindowMs);
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: attemptsSince } },
  });
  const lockoutUntil = await getLoginLockoutUntil(email);
  if (lockoutUntil !== undefined) {
    return loginErrorState(
      previousState,
      formData,
      "Trop de tentatives de connexion.",
      lockoutUntil,
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (user?.isBlocked) {
    return loginErrorState(
      previousState,
      formData,
      "Ce compte a été bloqué par un administrateur. Contactez l’administrateur du site pour rétablir votre accès.",
    );
  }

  if (!user || !(await compare(parsed.data.password, user.passwordHash))) {
    await prisma.loginAttempt.create({ data: { email } });
    const lockoutUntilAfterFailure = await getLoginLockoutUntil(email);
    return loginErrorState(
      previousState,
      formData,
      lockoutUntilAfterFailure === undefined
        ? "Adresse e-mail ou mot de passe invalide."
        : "Trop de tentatives de connexion.",
      lockoutUntilAfterFailure,
    );
  }

  if (user.role !== parsed.data.role) {
    return loginErrorState(
      previousState,
      formData,
      "Le profil sélectionné ne correspond pas à ce compte.",
    );
  }

  await prisma.loginAttempt.deleteMany({ where: { email } });
  await createSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  await recordUserActivity(
    { userId: user.id, name: user.name, email: user.email },
    "Connexion",
    "Connexion à l’espace d’administration",
  );
  redirect(getAdminPath("/admin", user.role));
}

export async function logoutAction() {
  const session = await requireSession();
  await recordUserActivity(session, "Déconnexion", "Déconnexion de l’espace d’administration");
  await clearSession();
  redirect(getAdminPath("/admin/login", session.role));
}

export async function leaveAdminAction() {
  const session = await requireSession();
  await recordUserActivity(session, "Déconnexion", "Déconnexion de l’espace d’administration");
  await clearSession();
  redirect("/");
}

const articleSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().trim().min(1).max(140),
  excerpt: z.string().trim().max(280),
  content: z.string().trim().max(20000),
  linkHref: z.string().trim().min(1).max(2048).optional(),
  linkLabel: z.string().trim().min(2).max(100).optional(),
  categoryId: z.string().trim().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

function createSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export async function createArticleAction(formData: FormData) {
  const session = await requireSession();
  const parsed = articleSchema.safeParse({
    title: formData.get("title"),
    id: formData.get("id") || undefined,
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    ...getPublicationButtonFields(formData),
    categoryId: formData.get("categoryId") || undefined,
    status: formData.get("status"),
  });
  if (!parsed.success) throw new Error("Les informations de l’article sont invalides.");
  validateOptionalButtonLink(parsed.data.linkHref);

  const { id, ...articleData } = parsed.data;
  const baseSlug = createSlug(parsed.data.title);
  if (!baseSlug) throw new Error("Le titre doit contenir des caractères valides pour créer une adresse.");
  const existing = id ? await prisma.article.findUnique({ where: { id } }) : null;
  if (id && (!existing || (session.role !== "ADMIN" && existing.authorId !== session.userId))) {
    throw new Error("Vous n’êtes pas autorisé à modifier cet article.");
  }
  const slug = existing ? existing.slug : await uniqueArticleSlug(baseSlug);
  const uploadedImage = await saveContentImage(formData.get("imageFile"));
  const removeImage = formData.get("removeImage") === "on";
  const uploadedPreview = await saveContentImage(formData.get("previewImageFile"));
  const removePreview = formData.get("removePreviewImage") === "on";

  const data = {
      ...articleData,
      slug,
      linkHref: articleData.linkHref ?? null,
      linkLabel: articleData.linkLabel ?? null,
      image: uploadedImage?.url ?? (removeImage ? null : existing?.image ?? null),
      previewImage:
        uploadedPreview?.url ??
        (removePreview ? null : existing?.previewImage ?? null),
      authorId: existing?.authorId ?? session.userId,
      publishedAt:
        articleData.status === "PUBLISHED"
          ? existing?.publishedAt ?? new Date()
          : null,
    };
  try {
    if (id) {
      await prisma.article.update({ where: { id }, data });
    } else {
      await prisma.article.create({ data });
    }
  } catch (error) {
    await cleanupFailedContentImages([uploadedImage, uploadedPreview], error);
  }
  if (existing?.image && existing.image !== data.image) {
    await removeUnusedContentImage(existing.image);
  }
  if (existing?.previewImage && existing.previewImage !== data.previewImage) {
    await removeUnusedContentImage(existing.previewImage);
  }
  await recordUserActivity(
    session,
    id ? "Modification" : "Création",
    `Actualité : ${parsed.data.title}`,
  );
  revalidatePath("/");
  revalidatePath("/actualites");
  revalidatePath("/admin/actualites");
  revalidatePath("/admin");
  redirect(getAdminPath(`/admin/actualites?${id ? "updated" : "created"}=1`, session.role));
}

async function uniqueArticleSlug(base: string, currentId?: string) {
  let slug = base;
  for (let suffix = 2; ; suffix += 1) {
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (!existing || existing.id === currentId) return slug;
    slug = `${base}-${suffix}`;
  }
}

const contentSchema = z.object({
  kind: z.enum(["activites", "annonces", "projets"]),
  id: z.string().cuid().optional(),
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().max(20000),
  excerpt: z.string().trim().max(280).optional(),
  linkHref: z.string().trim().min(1).max(2048).optional(),
  linkLabel: z.string().trim().min(2).max(100).optional(),
  category: z.string().trim().max(100).optional(),
  audience: z.string().trim().max(180).optional(),
  firstGroupTitle: z.string().trim().max(100).optional(),
  firstGroupItems: z.string().trim().max(1600).optional(),
  secondGroupTitle: z.string().trim().max(100).optional(),
  secondGroupItems: z.string().trim().max(1200).optional(),
  projectDate: z.iso.date().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "UPCOMING", "ONGOING", "COMPLETED"]),
  publicationStatus: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  location: z.string().trim().max(200).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  expiresAt: z.iso.date().optional(),
});

export async function createContentAction(formData: FormData) {
  const session = await requireSession();
  const parsed = contentSchema.safeParse({
    kind: formData.get("kind"),
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    excerpt: formData.get("excerpt") || undefined,
    ...getPublicationButtonFields(formData),
    category: formData.get("category") || undefined,
    audience: formData.get("audience") || undefined,
    firstGroupTitle: formData.get("firstGroupTitle") || undefined,
    firstGroupItems: formData.get("firstGroupItems") || undefined,
    secondGroupTitle: formData.get("secondGroupTitle") || undefined,
    secondGroupItems: formData.get("secondGroupItems") || undefined,
    projectDate: formData.get("projectDate") || undefined,
    status: formData.get("status"),
    publicationStatus: formData.get("publicationStatus") || undefined,
    location: formData.get("location") || undefined,
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    expiresAt: formData.get("expiresAt") || undefined,
  });
  if (!parsed.success) throw new Error("Les informations du contenu sont invalides.");
  validateOptionalButtonLink(parsed.data.linkHref);

  const titleSlug = createSlug(parsed.data.title);
  if (!titleSlug) throw new Error("Le titre doit contenir des caractères valides pour créer une adresse.");

  if (parsed.data.kind === "activites") {
    if (
      parsed.data.status !== "UPCOMING" &&
      parsed.data.status !== "ONGOING" &&
      parsed.data.status !== "COMPLETED"
    ) {
      throw new Error("Choisissez un état valide pour l’activité.");
    }
    const existing = parsed.data.id
      ? await prisma.activity.findUnique({ where: { id: parsed.data.id } })
      : null;
    if (parsed.data.id && (!existing || (session.role !== "ADMIN" && existing.authorId !== session.userId))) {
      throw new Error("Vous n’êtes pas autorisé à modifier cette activité.");
    }
    const startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : null;
    const endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null;
    if (!startDate || Number.isNaN(startDate.getTime()) || (endDate && Number.isNaN(endDate.getTime()))) {
      throw new Error("Indiquez une date de début valide.");
    }
    if (endDate && endDate < startDate) throw new Error("La date de fin doit être postérieure à la date de début.");
    const slug = existing ? existing.slug : await uniqueSlug("activity", titleSlug);
    const uploadedImage = await saveContentImage(formData.get("imageFile"));
    const removeImage = formData.get("removeImage") === "on";
    const uploadedPreview = await saveContentImage(formData.get("previewImageFile"));
    const removePreview = formData.get("removePreviewImage") === "on";
    const data = {
        title: parsed.data.title,
        slug,
        description: parsed.data.description,
        startDate,
        endDate,
        location: parsed.data.location || "À préciser",
        linkHref: parsed.data.linkHref ?? null,
        linkLabel: parsed.data.linkLabel ?? null,
        image: uploadedImage?.url ?? (removeImage ? null : existing?.image ?? null),
        previewImage:
          uploadedPreview?.url ??
          (removePreview ? null : existing?.previewImage ?? null),
        status:
          parsed.data.status === "UPCOMING" ||
          parsed.data.status === "ONGOING" ||
          parsed.data.status === "COMPLETED"
            ? parsed.data.status
            : "UPCOMING",
        publicationStatus: parsed.data.publicationStatus ?? "DRAFT",
        authorId: existing?.authorId ?? session.userId,
      };
    try {
      if (parsed.data.id) {
        await prisma.activity.update({ where: { id: parsed.data.id }, data });
      } else {
        await prisma.activity.create({ data });
      }
    } catch (error) {
      await cleanupFailedContentImages([uploadedImage, uploadedPreview], error);
    }
    if (existing?.image && existing.image !== data.image) {
      await removeUnusedContentImage(existing.image);
    }
    if (existing?.previewImage && existing.previewImage !== data.previewImage) {
      await removeUnusedContentImage(existing.previewImage);
    }
    revalidatePath("/");
    revalidatePath("/activites");
    revalidatePath("/admin/activites");
  } else if (parsed.data.kind === "annonces") {
    if (parsed.data.status !== "DRAFT" && parsed.data.status !== "PUBLISHED") {
      throw new Error("Choisissez un statut valide pour l’annonce.");
    }
    const existing = parsed.data.id
      ? await prisma.announcement.findUnique({ where: { id: parsed.data.id } })
      : null;
    if (parsed.data.id && (!existing || (session.role !== "ADMIN" && existing.authorId !== session.userId))) {
      throw new Error("Vous n’êtes pas autorisé à modifier cette annonce.");
    }
    const slug = existing ? existing.slug : await uniqueSlug("announcement", titleSlug);
    const status: "DRAFT" | "PUBLISHED" =
      parsed.data.status === "DRAFT" ? "DRAFT" : "PUBLISHED";
    const expiresAt = parsed.data.expiresAt
      ? new Date(`${parsed.data.expiresAt}T00:00:00.000Z`)
      : null;
    expiresAt?.setUTCDate(expiresAt.getUTCDate() + 1);
    if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new Error("La date d’expiration est invalide.");
    const uploadedImage = await saveContentImage(formData.get("imageFile"));
    const removeImage = formData.get("removeImage") === "on";
    const uploadedPreview = await saveContentImage(formData.get("previewImageFile"));
    const removePreview = formData.get("removePreviewImage") === "on";
    const data = {
        title: parsed.data.title,
        slug,
        excerpt: parsed.data.excerpt || null,
        content: parsed.data.description,
        linkHref: parsed.data.linkHref ?? null,
        linkLabel: parsed.data.linkLabel ?? null,
        image: uploadedImage?.url ?? (removeImage ? null : existing?.image ?? null),
        previewImage:
          uploadedPreview?.url ??
          (removePreview ? null : existing?.previewImage ?? null),
        expiresAt,
        status,
        publishedAt: status === "PUBLISHED" ? existing?.publishedAt ?? new Date() : null,
        authorId: existing?.authorId ?? session.userId,
      };
    try {
      if (parsed.data.id) {
        await prisma.announcement.update({ where: { id: parsed.data.id }, data });
      } else {
        await prisma.announcement.create({ data });
      }
    } catch (error) {
      await cleanupFailedContentImages([uploadedImage, uploadedPreview], error);
    }
    if (existing?.image && existing.image !== data.image) {
      await removeUnusedContentImage(existing.image);
    }
    if (existing?.previewImage && existing.previewImage !== data.previewImage) {
      await removeUnusedContentImage(existing.previewImage);
    }
    revalidatePath("/annonces");
    revalidatePath("/admin/annonces");
  } else {
      if (!siteLinkSchema.safeParse(parsed.data.linkHref).success) {
        throw new Error("Indiquez un lien interne ou une adresse HTTPS valide pour le projet.");
      }
      const existing = parsed.data.id
        ? await prisma.project.findUnique({ where: { id: parsed.data.id } })
      : null;
    if (parsed.data.id && (!existing || (session.role !== "ADMIN" && existing.authorId !== session.userId))) {
      throw new Error("Vous n’êtes pas autorisé à modifier ce projet.");
    }
    const slug = existing ? existing.slug : await uniqueSlug("project", titleSlug);
    const status: "DRAFT" | "PUBLISHED" =
      parsed.data.status === "DRAFT" ? "DRAFT" : "PUBLISHED";
    const uploadedImage = await saveContentImage(formData.get("imageFile"));
    const removeImage = formData.get("removeImage") === "on";
    const uploadedPreview = await saveContentImage(formData.get("previewImageFile"));
    const removePreview = formData.get("removePreviewImage") === "on";
    const data = {
        title: parsed.data.title,
        slug,
        excerpt: parsed.data.excerpt ?? parsed.data.description.slice(0, 280),
        description: parsed.data.description,
        category: parsed.data.category ?? null,
        audience: parsed.data.audience ?? null,
        firstGroupTitle: parsed.data.firstGroupTitle ?? null,
        firstGroupItems: parsed.data.firstGroupItems ?? null,
        secondGroupTitle: parsed.data.secondGroupTitle ?? null,
        secondGroupItems: parsed.data.secondGroupItems ?? null,
        linkHref: parsed.data.linkHref,
        linkLabel: parsed.data.linkLabel,
        projectDate: parsed.data.projectDate
          ? new Date(`${parsed.data.projectDate}T00:00:00.000Z`)
          : null,
        image: uploadedImage?.url ?? (removeImage ? null : existing?.image ?? null),
        previewImage:
          uploadedPreview?.url ??
          (removePreview ? null : existing?.previewImage ?? null),
        status,
        publishedAt: status === "PUBLISHED" ? existing?.publishedAt ?? new Date() : null,
        authorId: existing?.authorId ?? session.userId,
      };
    try {
      if (parsed.data.id) {
        await prisma.project.update({ where: { id: parsed.data.id }, data });
      } else {
        await prisma.project.create({ data });
      }
    } catch (error) {
      await cleanupFailedContentImages([uploadedImage, uploadedPreview], error);
    }
    if (existing?.image && existing.image !== data.image) {
      await removeUnusedContentImage(existing.image);
    }
    if (existing?.previewImage && existing.previewImage !== data.previewImage) {
      await removeUnusedContentImage(existing.previewImage);
    }
    revalidatePath("/projets");
    revalidatePath("/admin/projets");
  }
  const contentLabels = {
    activites: "Activité",
    annonces: "Annonce",
    projets: "Projet",
  } as const;
  await recordUserActivity(
    session,
    parsed.data.id ? "Modification" : "Création",
    `${contentLabels[parsed.data.kind]} : ${parsed.data.title}`,
  );
  revalidatePath("/admin");
  redirect(getAdminPath(`/admin/${parsed.data.kind}?${parsed.data.id ? "updated" : "created"}=1`, session.role));
}

async function uniqueSlug(
  model: "activity" | "announcement" | "project",
  base: string,
  currentId?: string,
) {
  let slug = base;
  for (let suffix = 2; ; suffix += 1) {
    const found =
      model === "activity"
        ? await prisma.activity.findUnique({ where: { slug } })
        : model === "announcement"
          ? await prisma.announcement.findUnique({ where: { slug } })
          : await prisma.project.findUnique({ where: { slug } });
    if (!found || found.id === currentId) return slug;
    slug = `${base}-${suffix}`;
  }
}

export async function deleteArticleAction(formData: FormData) {
  const session = await requireSession();
  const id = z.string().cuid().parse(formData.get("id"));
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article || (session.role !== "ADMIN" && article.authorId !== session.userId)) {
    throw new Error("Vous n’êtes pas autorisé à supprimer cet article.");
  }

  await prisma.article.delete({ where: { id } });
  await removeUnusedContentImage(article.image);
  await removeUnusedContentImage(article.previewImage);
  await recordUserActivity(session, "Suppression", `Actualité : ${article.title}`);
  revalidatePath("/");
  revalidatePath("/actualites");
  revalidatePath("/admin/actualites");
  revalidatePath("/admin");
}

const userSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  password: z.string().min(12).max(128),
  role: z.enum(["ADMIN", "EDITOR"]),
});

export type CreateUserState = {
  error?: string;
};

export async function createUserAction(
  _previousState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const session = await requireAdmin();
  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Les informations du compte sont invalides." };

  const email = parsed.data.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) return { error: "Un compte existe déjà avec cette adresse e-mail." };

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash: await hash(parsed.data.password, 12),
        role: parsed.data.role,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { error: "Un compte existe déjà avec cette adresse e-mail." };
    }
    throw error;
  }
  await recordUserActivity(
    session,
    "Création",
    `Compte utilisateur : ${parsed.data.name} (${email})`,
  );
  revalidatePath("/admin/utilisateurs");
  redirect(getAdminPath("/admin/utilisateurs?created=1", "ADMIN"));
}

export async function updateUserRoleAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = z.object({
    id: z.string().cuid(),
    role: z.enum(["ADMIN", "EDITOR"]),
  }).safeParse({
    id: formData.get("id"),
    role: formData.get("role"),
  });
  if (!parsed.success) throw new Error("Les informations de rôle sont invalides.");
  if (parsed.data.id === session.userId && parsed.data.role !== "ADMIN") {
    throw new Error("Vous ne pouvez pas retirer votre propre rôle administrateur.");
  }
  const target = await prisma.user.findUnique({
    where: { id: parsed.data.id },
    select: { name: true, email: true, role: true, isBlocked: true },
  });
  if (!target) throw new Error("Cet utilisateur n’existe plus.");
  if (
    target.role === "ADMIN" &&
    !target.isBlocked &&
    parsed.data.role !== "ADMIN" &&
    (await prisma.user.count({
      where: { role: "ADMIN", isBlocked: false },
    })) <= 1
  ) {
    throw new Error("Le site doit conserver au moins un administrateur.");
  }

  await prisma.user.update({
    where: { id: parsed.data.id },
    data: { role: parsed.data.role },
  });
  if (target.role !== parsed.data.role) {
    const roleLabel = parsed.data.role === "ADMIN" ? "Administrateur" : "Rédacteur";
    await recordUserActivity(
      session,
      "Modification",
      `Rôle de ${target.name} (${target.email}) : ${roleLabel}`,
    );
  }
  revalidatePath("/admin/utilisateurs");
}

export async function deleteUserAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = z.object({ id: z.string().cuid() }).safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) throw new Error("Les informations du compte sont invalides.");
  const { id } = parsed.data;
  if (id === session.userId) throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
  const target = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id },
      select: { name: true, email: true, role: true, isBlocked: true },
    });
    if (!user) throw new Error("Cet utilisateur n’existe plus.");
    if (
      user.role === "ADMIN" &&
      !user.isBlocked &&
      (await tx.user.count({
        where: { role: "ADMIN", isBlocked: false, id: { not: id } },
      })) === 0
    ) {
      throw new Error("Le site doit conserver au moins un administrateur actif.");
    }

    await Promise.all([
      tx.article.updateMany({ where: { authorId: id }, data: { authorId: session.userId } }),
      tx.activity.updateMany({ where: { authorId: id }, data: { authorId: session.userId } }),
      tx.announcement.updateMany({ where: { authorId: id }, data: { authorId: session.userId } }),
      tx.project.updateMany({ where: { authorId: id }, data: { authorId: session.userId } }),
      tx.media.updateMany({ where: { uploadedById: id }, data: { uploadedById: session.userId } }),
      tx.messageReply.updateMany({ where: { senderId: id }, data: { senderId: session.userId } }),
    ]);
    await tx.user.delete({ where: { id } });
    return user;
  });
  await recordUserActivity(
    session,
    "Suppression",
    `Compte utilisateur : ${target.name} (${target.email})`,
  );
  revalidatePath("/admin/utilisateurs");
}

export async function setUserBlockedAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = z.object({
    id: z.string().cuid(),
    isBlocked: z.enum(["true", "false"]),
  }).safeParse({
    id: formData.get("id"),
    isBlocked: formData.get("isBlocked"),
  });
  if (!parsed.success) throw new Error("Les informations du compte sont invalides.");
  if (parsed.data.id === session.userId && parsed.data.isBlocked === "true") {
    throw new Error("Vous ne pouvez pas bloquer votre propre compte.");
  }

  const isBlocked = parsed.data.isBlocked === "true";
  const target = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, name: true, email: true, role: true, isBlocked: true },
    });
    if (!user) throw new Error("Cet utilisateur n’existe plus.");
    if (
      isBlocked &&
      !user.isBlocked &&
      user.role === "ADMIN" &&
      (await tx.user.count({
        where: { role: "ADMIN", isBlocked: false, id: { not: user.id } },
      })) === 0
    ) {
      throw new Error("Le site doit conserver au moins un administrateur actif.");
    }
    if (user.isBlocked !== isBlocked) {
      await tx.user.update({ where: { id: user.id }, data: { isBlocked } });
    }
    return user;
  });

  if (target.isBlocked !== isBlocked) {
    await recordUserActivity(
      session,
      isBlocked ? "Blocage" : "Déblocage",
      `Compte utilisateur : ${target.name} (${target.email})`,
    );
  }
  revalidatePath("/admin/utilisateurs");
}

export async function markMessageReadAction(formData: FormData) {
  const session = await requireAdmin();
  const id = z.string().cuid().parse(formData.get("id"));
  await prisma.message.update({ where: { id }, data: { readAt: new Date() } });
  await recordUserActivity(session, "Marquage", "Message de contact marqué comme lu");
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function deleteMessageAction(formData: FormData) {
  const session = await requireAdmin();
  const id = z.string().cuid().parse(formData.get("id"));
  await prisma.message.delete({ where: { id } });
  await recordUserActivity(session, "Suppression", "Message de contact");
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function deleteSelectedMessagesAction(formData: FormData) {
  const session = await requireAdmin();
  const parsedIds = z.array(z.string().cuid()).min(1).safeParse(formData.getAll("messageIds"));
  if (!parsedIds.success) {
    throw new Error("Sélectionnez au moins un message à supprimer.");
  }

  const deleted = await prisma.message.deleteMany({
    where: { id: { in: [...new Set(parsedIds.data)] } },
  });
  await recordUserActivity(
    session,
    "Suppression",
    `${deleted.count} message${deleted.count === 1 ? "" : "s"} de contact`,
  );
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function deleteUserActivityAction(formData: FormData) {
  await requireAdmin();
  const id = z.string().cuid().parse(formData.get("id"));
  await prisma.userActivity.delete({ where: { id } });
  revalidatePath("/admin/utilisateurs");
}

export async function deleteSelectedUserActivitiesAction(formData: FormData) {
  await requireAdmin();
  const parsedIds = z.array(z.string().cuid()).min(1).safeParse(formData.getAll("activityIds"));
  if (!parsedIds.success) {
    throw new Error("Sélectionnez au moins une action à supprimer.");
  }
  await prisma.userActivity.deleteMany({
    where: { id: { in: [...new Set(parsedIds.data)] } },
  });
  revalidatePath("/admin/utilisateurs");
}

export async function deleteAllUserActivitiesAction() {
  await requireAdmin();
  await prisma.userActivity.deleteMany();
  revalidatePath("/admin/utilisateurs");
}

export type SendMessageReplyState = {
  error?: string;
  success?: string;
};

export type GmailConfigurationState = {
  error?: string;
  success?: string;
};

const gmailConfigurationFormSchema = z.object({
  account: z.email().trim().max(254),
  appPassword: z.string().trim().max(200),
  allowedFrom: z.string().trim().max(2000),
});

export async function saveGmailConfigurationAction(
  _previousState: GmailConfigurationState,
  formData: FormData,
): Promise<GmailConfigurationState> {
  await requireAdmin();
  const parsed = gmailConfigurationFormSchema.safeParse({
    account: formData.get("account"),
    appPassword: formData.get("appPassword"),
    allowedFrom: formData.get("allowedFrom"),
  });
  if (!parsed.success) {
    return { error: "Vérifiez le compte Gmail, le mot de passe d’application et les adresses alias." };
  }

  const account = parsed.data.account.toLowerCase();
  const existing = await getGmailConfiguration();
  const appPassword =
    parsed.data.appPassword.replace(/\s/g, "") || existing?.appPassword;
  if (!appPassword) {
    return { error: "Saisissez le mot de passe d’application Gmail pour configurer l’envoi." };
  }

  const aliasEmails = parsed.data.allowedFrom
    .split(/[\n,;]/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const aliases = z.array(z.email()).safeParse(aliasEmails);
  if (!aliases.success) {
    return { error: "Une ou plusieurs adresses alias ne sont pas valides." };
  }

  const configuration = {
    account,
    appPassword,
    allowedFrom: [...new Set(aliases.data.filter((email) => email !== account))],
  };
  try {
    await verifyGmailConfiguration(configuration);
  } catch (error) {
    console.error("Échec de la vérification de la configuration Gmail :", error);
    return {
      error: "Connexion Gmail impossible. Vérifiez le compte et son mot de passe d’application, puis réessayez.",
    };
  }

  await saveGmailConfiguration(configuration);
  revalidatePath("/admin/messages");
  return { success: "La connexion Gmail est vérifiée et la configuration a été enregistrée de façon sécurisée." };
}

const sendMessageReplySchema = z.object({
  messageId: z.string().cuid(),
  senderName: z.string().trim().min(2).max(80).refine((value) => !/[\r\n]/.test(value)),
  senderEmail: z.email().trim().max(254),
  recipientEmail: z.email().trim().max(254),
  subject: z.string().trim().min(1).max(200).refine((value) => !/[\r\n]/.test(value)),
  body: z.string().trim().min(1).max(10000),
});

export async function sendMessageReplyAction(
  _previousState: SendMessageReplyState,
  formData: FormData,
): Promise<SendMessageReplyState> {
  const session = await requireAdmin();
  const parsed = sendMessageReplySchema.safeParse({
    messageId: formData.get("messageId"),
    senderName: formData.get("senderName"),
    senderEmail: formData.get("senderEmail"),
    recipientEmail: formData.get("recipientEmail"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: "Vérifiez le nom, les adresses e-mail, l’objet et le contenu de la réponse." };

  const message = await prisma.message.findUnique({
    where: { id: parsed.data.messageId },
    select: { id: true, email: true },
  });
  if (!message) return { error: "Ce message n’existe plus." };

  if (message.email.toLowerCase() !== parsed.data.recipientEmail.toLowerCase()) {
    return { error: "L’adresse du destinataire ne correspond plus à celle du message d’origine." };
  }

  const reply = await prisma.messageReply.create({
    data: {
      messageId: message.id,
      senderId: session.userId,
      senderName: parsed.data.senderName,
      senderEmail: parsed.data.senderEmail.toLowerCase(),
      subject: parsed.data.subject,
      body: parsed.data.body,
      status: "PENDING",
    },
  });

  try {
    await sendGmailMessage({
      fromName: parsed.data.senderName,
      fromEmail: parsed.data.senderEmail,
      to: parsed.data.recipientEmail,
      subject: parsed.data.subject,
      text: parsed.data.body,
    });
  } catch (error) {
    await prisma.messageReply.update({
      where: { id: reply.id },
      data: { status: "FAILED" },
    });
    console.error("Échec de l’envoi d’une réponse Gmail :", error);
    if (error instanceof Error && error.message === "GMAIL_CONFIGURATION_MISSING") {
      return { error: "L’envoi Gmail n’est pas configuré sur le serveur. Ajoutez GMAIL_USER et GMAIL_APP_PASSWORD à sa configuration." };
    }
    if (error instanceof Error && error.message === "GMAIL_SENDER_NOT_ALLOWED") {
      return { error: "Cette adresse d’expéditeur n’est pas autorisée. Ajoutez-la à GMAIL_ALLOWED_FROM et configurez-la comme alias dans Gmail." };
    }
    return { error: "Gmail n’a pas pu envoyer cette réponse. Vérifiez la configuration du compte et de l’alias, puis réessayez." };
  }

  await prisma.messageReply.update({
    where: { id: reply.id },
    data: { status: "SENT" },
  });
  await prisma.message.updateMany({
    where: { id: message.id, readAt: null },
    data: { readAt: new Date() },
  });
  await recordUserActivity(session, "Réponse", "Réponse enregistrée pour un message de contact");
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: "Votre réponse a été ajoutée à l’historique." };
}

const siteLinkSchema = z.string().trim().min(1).max(2048).refine(
  (value) =>
    (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && !/[\u0000-\u001f]/.test(value)) ||
    z.url({ protocol: /^https?$/ }).safeParse(value).success,
  "Indiquez un lien interne ou une adresse HTTPS valide.",
);

function validateOptionalButtonLink(href?: string) {
  if (href && !siteLinkSchema.safeParse(href).success) {
    throw new Error("Indiquez un lien interne ou une adresse HTTPS valide.");
  }
}

const siteImageSchema = z.string().trim().min(1).max(2048).refine(
  (value) =>
    /^\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) ||
    /^\/solutions\/(annonces|batakiplus|cenou-kibaru|imomali)-logo\.webp$/.test(value) ||
    z.url({ protocol: /^https?$/ }).safeParse(value).success,
  "Choisissez une image du site ou une adresse HTTP(S) valide.",
);

const solutionEditorSchema = z.object({
  solutionId: z.enum(["annonces", "bataki", "cenou", "immo"]),
  name: z.string().trim().min(1).max(100),
  date: z.union([z.iso.date(), z.literal("")]).optional().default(""),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  category: z.string().trim().max(100).optional().default(""),
  audience: z.string().trim().max(180).optional().default(""),
  description: z.string().trim().max(600).optional().default(""),
  firstGroupTitle: z.string().trim().max(100).optional().default(""),
  firstGroupItems: z.string().trim().max(1600).optional().default(""),
  secondGroupTitle: z.string().trim().max(100).optional(),
  secondGroupItems: z.string().trim().max(1200).optional(),
  href: siteLinkSchema.optional().default(defaultButtonHref),
  linkLabel: z.string().trim().max(100).optional().default(defaultButtonLabel),
  image: siteImageSchema,
  previewImage: z.union([z.literal(""), siteImageSchema]).optional().default(""),
});

const solutionSettingKeys = {
  annonces: {
    visible: "solutionAnnoncesVisible",
    status: "solutionAnnoncesStatus",
    name: "solutionAnnoncesName",
    date: "solutionAnnoncesDate",
    category: "solutionAnnoncesCategory",
    audience: "solutionAnnoncesAudience",
    description: "solutionAnnoncesDescription",
    firstGroupTitle: "solutionAnnoncesRecruiterTitle",
    firstGroupItems: "solutionAnnoncesRecruiterItems",
    secondGroupTitle: "solutionAnnoncesCandidateTitle",
    secondGroupItems: "solutionAnnoncesCandidateItems",
    href: "solutionAnnoncesHref",
    linkLabel: "solutionAnnoncesLinkLabel",
    image: "solutionAnnoncesImage",
    previewImage: "solutionAnnoncesPreviewImage",
  },
  bataki: {
    visible: "solutionBatakiVisible",
    status: "solutionBatakiStatus",
    name: "solutionBatakiName",
    date: "solutionBatakiDate",
    category: "solutionBatakiCategory",
    audience: "solutionBatakiAudience",
    description: "solutionBatakiDescription",
    firstGroupTitle: "solutionBatakiFeaturesTitle",
    firstGroupItems: "solutionBatakiFeatures",
    href: "solutionBatakiHref",
    linkLabel: "solutionBatakiLinkLabel",
    image: "solutionBatakiImage",
    previewImage: "solutionBatakiPreviewImage",
  },
  cenou: {
    visible: "solutionCenouVisible",
    status: "solutionCenouStatus",
    name: "solutionCenouName",
    date: "solutionCenouDate",
    category: "solutionCenouCategory",
    audience: "solutionCenouAudience",
    description: "solutionCenouDescription",
    firstGroupTitle: "solutionCenouStudentTitle",
    firstGroupItems: "solutionCenouStudentItems",
    secondGroupTitle: "solutionCenouAdministrationTitle",
    secondGroupItems: "solutionCenouAdministrationItems",
    href: "solutionCenouHref",
    linkLabel: "solutionCenouLinkLabel",
    image: "solutionCenouImage",
    previewImage: "solutionCenouPreviewImage",
  },
  immo: {
    visible: "solutionImmoVisible",
    status: "solutionImmoStatus",
    name: "solutionImmoName",
    date: "solutionImmoDate",
    category: "solutionImmoCategory",
    audience: "solutionImmoAudience",
    description: "solutionImmoDescription",
    firstGroupTitle: "solutionImmoFirstGroupTitle",
    firstGroupItems: "solutionImmoFirstGroupItems",
    secondGroupTitle: "solutionImmoSecondGroupTitle",
    secondGroupItems: "solutionImmoSecondGroupItems",
    href: "solutionImmoHref",
    linkLabel: "solutionImmoLinkLabel",
    image: "solutionImmoImage",
    previewImage: "solutionImmoPreviewImage",
  },
} as const;
const projectSolutionSettingKeys: Set<string> = new Set(
  Object.values(solutionSettingKeys).flatMap((keys) => Object.values(keys)),
);

const siteSettingsSchema = z.object({
  logoUrl: z.string().trim().min(1).max(2048),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  deepColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  legalName: z.string().trim().min(2).max(120),
  location: z.string().trim().max(160),
  locationLatitude: z.string().trim().max(32),
  locationLongitude: z.string().trim().max(32),
  contactEmail: z.union([z.email().max(254), z.literal("")]),
  phonePrimary: z.string().trim().max(30).regex(/^[+\d\s().-]*$/),
  phoneSecondary: z.string().trim().max(30).regex(/^[+\d\s().-]*$/),
  registration: z.string().trim().max(80),
  taxNumber: z.string().trim().max(80),
  bankAccount: z.string().trim().max(100),
  linkedinUrl: z.union([z.url({ protocol: /^https?$/ }).max(2048), z.literal("")]),
  instagramUrl: z.union([z.url({ protocol: /^https?$/ }).max(2048), z.literal("")]),
  homeHeroImageUrl: z.string().trim().max(2048),
  homeEyebrow: z.string().trim().min(2).max(100),
  homeTitleFirst: z.string().trim().min(1).max(80),
  homeTitleBridge: z.string().trim().min(1).max(80),
  homeTitleEmphasis: z.string().trim().min(1).max(80),
  homeTitleLast: z.string().trim().min(1).max(80),
  homeDescription: z.string().trim().min(10).max(500),
  homePrimaryLabel: z.string().trim().min(2).max(80),
  homePrimaryHref: siteLinkSchema,
  homeSecondaryLabel: z.string().trim().min(2).max(80),
  homeSecondaryHref: siteLinkSchema,
  homeIntroKicker: z.string().trim().min(2).max(100),
  homeIntroTitle: z.string().trim().min(5).max(180),
  homeIntroText: z.string().trim().min(10).max(600),
  homeNewsKicker: z.string().trim().min(2).max(100),
  homeNewsTitleLead: z.string().trim().min(1).max(80),
  homeNewsTitleAccent: z.string().trim().min(1).max(80),
  homeNewsAllLabel: z.string().trim().min(2).max(80),
  homeNewsFeaturedTitle: z.string().trim().max(180),
  homeNewsFeaturedText: z.string().trim().max(500),
  homeNewsFeaturedLabel: z.string().trim().min(2).max(80),
  homeNewsFeaturedBadge: z.string().trim().min(2).max(50),
  homeNewsExploreLabel: z.string().trim().min(2).max(80),
  homeNewsEmptyTitle: z.string().trim().min(2).max(120),
  homeNewsEmptyText: z.string().trim().min(10).max(300),
  homeShowNews: z.enum(["true", "false"]),
  homeShowApproach: z.enum(["true", "false"]),
  homeShowActivities: z.enum(["true", "false"]),
  homeShowCta: z.enum(["true", "false"]),
  homeNewsOrder: z.enum(["1", "2", "3", "4"]),
  homeApproachOrder: z.enum(["1", "2", "3", "4"]),
  homeActivitiesOrder: z.enum(["1", "2", "3", "4"]),
  homeCtaOrder: z.enum(["1", "2", "3", "4"]),
}).superRefine((settings, context) => {
  if (Boolean(settings.locationLatitude) !== Boolean(settings.locationLongitude)) {
    context.addIssue({
      code: "custom",
      message: "Les coordonnées GPS doivent être renseignées ensemble.",
      path: ["locationLatitude"],
    });
  }
  const latitude = Number(settings.locationLatitude);
  const longitude = Number(settings.locationLongitude);
  if (settings.locationLatitude && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
    context.addIssue({
      code: "custom",
      message: "La latitude GPS doit être comprise entre -90 et 90.",
      path: ["locationLatitude"],
    });
  }
  if (settings.locationLongitude && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    context.addIssue({
      code: "custom",
      message: "La longitude GPS doit être comprise entre -180 et 180.",
      path: ["locationLongitude"],
    });
  }
  const sectionOrder = [
    { visible: settings.homeShowNews, order: settings.homeNewsOrder },
    { visible: settings.homeShowApproach, order: settings.homeApproachOrder },
    { visible: settings.homeShowActivities, order: settings.homeActivitiesOrder },
    { visible: settings.homeShowCta, order: settings.homeCtaOrder },
  ]
    .filter((section) => section.visible === "true")
    .map((section) => section.order);
  if (new Set(sectionOrder).size !== sectionOrder.length) {
    context.addIssue({
      code: "custom",
      message: "Chaque section doit avoir une position différente.",
      path: ["homeNewsOrder"],
    });
  }
});

export async function updateSiteSettingsAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = siteSettingsSchema.safeParse(
    Object.fromEntries(
      Object.keys(defaultSiteSettings)
        .filter((key) => !projectSolutionSettingKeys.has(key))
        .map((key) => [key, formData.get(key)]),
    ),
  );
  if (!parsed.success) throw new Error("Vérifiez les informations de personnalisation saisies.");

  const previousLogo = await prisma.setting.findUnique({
    where: { key: "logoUrl" },
    select: { value: true },
  });
  const previousLogoUrl = previousLogo?.value ?? "";
  const uploadedLogo = await saveContentImage(formData.get("logoFile"));
  const nextLogoUrl = uploadedLogo?.url ?? parsed.data.logoUrl;
  const { homeHeroImageUrl } = parsed.data;
  const selectedMediaUrls = [
    nextLogoUrl,
    homeHeroImageUrl,
  ].filter(
    (url) =>
      url &&
      url !== uploadedLogo?.url &&
      !(url === previousLogoUrl && url.startsWith("/uploads/")) &&
      !siteLogoOptions.some((logo) => logo.url === url),
  );
  try {
    if (selectedMediaUrls.length) {
      const availableMedia = await prisma.media.findMany({
        where: { url: { in: selectedMediaUrls }, type: "image" },
        select: { url: true },
      });
      const allowedMediaUrls = new Set(availableMedia.map(({ url }) => url));
      if (selectedMediaUrls.some((url) => !allowedMediaUrls.has(url))) {
        throw new Error("Choisissez une image parmi les visuels du site ou de la médiathèque.");
      }
    }

    await prisma.$transaction(
      Object.entries({ ...parsed.data, logoUrl: nextLogoUrl }).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        }),
      ),
    );
  } catch (error) {
    if (uploadedLogo) {
      await cleanupFailedContentImages([uploadedLogo], error);
    }
    throw error;
  }
  if (previousLogoUrl && previousLogoUrl !== nextLogoUrl) {
    await removeUnusedContentImage(previousLogoUrl);
  }
  await recordUserActivity(session, "Modification", "Paramètres généraux du site");
  revalidatePath("/", "layout");
  revalidatePath("/projets");
  revalidatePath("/admin/personnalisation");
  redirect(getAdminPath("/admin/personnalisation?saved=1", "ADMIN"));
}

export async function updateProjectSolutionsAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = solutionEditorSchema.safeParse(
    Object.fromEntries(
      [
        "solutionId",
        "name",
        "date",
        "status",
        "category",
        "audience",
        "description",
        "firstGroupTitle",
        "firstGroupItems",
        "secondGroupTitle",
        "secondGroupItems",
        "href",
        "linkLabel",
        "image",
        "previewImage",
      ].map((key) => [key, formData.get(key) || undefined]),
    ),
  );
  if (!parsed.success) throw new Error("Vérifiez les informations des solutions saisies.");

  const { solutionId, ...solutionData } = parsed.data;
  const settingKeys = solutionSettingKeys[solutionId];
  const savedImages = await prisma.setting.findMany({
    where: { key: { in: [settingKeys.image, settingKeys.previewImage] } },
    select: { key: true, value: true },
  });
  const savedImageUrls = new Map(savedImages.map(({ key, value }) => [key, value]));
  const savedImageUrl = savedImageUrls.get(settingKeys.image);
  const savedPreviewImageUrl = savedImageUrls.get(settingKeys.previewImage);
  const uploadedImage = await saveContentImage(formData.get("imageFile"));
  let uploadedPreview: Awaited<ReturnType<typeof saveContentImage>>;
  try {
    uploadedPreview = await saveContentImage(formData.get("previewImageFile"));
  } catch (error) {
    if (uploadedImage) {
      await cleanupFailedContentImages([uploadedImage], error);
    }
    throw error;
  }
  const nextImage = uploadedImage?.url ?? solutionData.image;
  const removePreview = formData.get("removePreviewImage") === "on";
  const nextPreviewImage =
    uploadedPreview?.url ?? (removePreview ? "" : solutionData.previewImage);
  const builtInImages = [
    "/solutions/annonces-logo.webp",
    "/solutions/batakiplus-logo.webp",
    "/solutions/cenou-kibaru-logo.webp",
    "/solutions/imomali-logo.webp",
  ];
  const selectedMediaUrls = [nextImage, nextPreviewImage].filter(
    (url) =>
      Boolean(url) &&
      url !== uploadedImage?.url &&
      url !== uploadedPreview?.url &&
      !(
        url.startsWith("/uploads/") &&
        ((url === nextImage && url === savedImageUrl) ||
          (url === nextPreviewImage && url === savedPreviewImageUrl))
      ) &&
      !builtInImages.includes(url) &&
      !siteLogoOptions.some((logo) => logo.url === url),
  );
  try {
    if (selectedMediaUrls.length) {
      const availableMedia = await prisma.media.findMany({
        where: { url: { in: selectedMediaUrls }, type: "image" },
        select: { url: true },
      });
      const allowedMediaUrls = new Set(availableMedia.map(({ url }) => url));
      if (selectedMediaUrls.some((url) => !allowedMediaUrls.has(url))) {
        throw new Error("Choisissez une image parmi les visuels du site ou de la médiathèque.");
      }
    }

    const settingEntries: [string, string][] = [
      [settingKeys.visible, "true"],
      [settingKeys.status, solutionData.status],
      [settingKeys.name, solutionData.name],
      [settingKeys.date, solutionData.date ?? ""],
      [settingKeys.category, solutionData.category],
      [settingKeys.audience, solutionData.audience],
      [settingKeys.description, solutionData.description],
      [settingKeys.firstGroupTitle, solutionData.firstGroupTitle],
      [settingKeys.firstGroupItems, solutionData.firstGroupItems],
      [settingKeys.href, solutionData.href],
      [settingKeys.linkLabel, solutionData.linkLabel],
      [settingKeys.image, nextImage],
      [settingKeys.previewImage, nextPreviewImage],
    ];
    if ("secondGroupTitle" in settingKeys) {
      settingEntries.push(
        [settingKeys.secondGroupTitle, solutionData.secondGroupTitle ?? ""],
        [settingKeys.secondGroupItems, solutionData.secondGroupItems ?? ""],
      );
    }

    await prisma.$transaction(
      settingEntries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        }),
      ),
    );
  } catch (error) {
    if (uploadedImage || uploadedPreview) {
      await cleanupFailedContentImages([uploadedImage, uploadedPreview], error);
    }
    throw error;
  }
  if (savedImageUrl && savedImageUrl !== nextImage) {
    await removeUnusedContentImage(savedImageUrl);
  }
  if (savedPreviewImageUrl && savedPreviewImageUrl !== nextPreviewImage) {
    await removeUnusedContentImage(savedPreviewImageUrl);
  }
  await recordUserActivity(
    session,
    "Modification",
    `Solution de projet : ${solutionData.name}`,
  );
  revalidatePath("/", "layout");
  revalidatePath("/projets");
  revalidatePath("/admin/projets");
  revalidatePath("/admin");
  redirect(getAdminPath(`/admin/projets?solutionUpdated=${solutionId}`, "ADMIN"));
}

const projectSolutionVisibilityKeys = {
  annonces: "solutionAnnoncesVisible",
  bataki: "solutionBatakiVisible",
  cenou: "solutionCenouVisible",
  immo: "solutionImmoVisible",
} as const;

export async function deleteProjectSolutionAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = z.enum(["annonces", "bataki", "cenou", "immo"]).safeParse(formData.get("solutionId"));
  if (!parsed.success) throw new Error("La solution à supprimer est invalide.");

  await prisma.setting.upsert({
    where: { key: projectSolutionVisibilityKeys[parsed.data] },
    create: { key: projectSolutionVisibilityKeys[parsed.data], value: "false" },
    update: { value: "false" },
  });
  const solutionLabels = {
    annonces: "Annonces",
    bataki: "Bataki Plus",
    cenou: "Cenou Kibaru",
    immo: "ImoMali",
  } as const;
  await recordUserActivity(
    session,
    "Suppression",
    `Solution de projet masquée : ${solutionLabels[parsed.data]}`,
  );
  revalidatePath("/", "layout");
  revalidatePath("/projets");
  revalidatePath("/admin/projets");
  revalidatePath("/admin");
  redirect(getAdminPath("/admin/projets?solutionDeleted=1", "ADMIN"));
}

export async function updateSiteLogoAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = z.string().trim().min(1).max(2048).safeParse(formData.get("logoUrl"));
  if (!parsed.success) throw new Error("Choisissez un logo valide.");

  const previousLogo = await prisma.setting.findUnique({
    where: { key: "logoUrl" },
    select: { value: true },
  });
  const previousLogoUrl = previousLogo?.value ?? "";
  const uploadedLogo = await saveContentImage(formData.get("logoFile"));
  const nextLogoUrl = uploadedLogo?.url ?? parsed.data;

  try {
    const isBuiltInLogo = siteLogoOptions.some((logo) => logo.url === nextLogoUrl);
    if (!uploadedLogo && !isBuiltInLogo && nextLogoUrl !== previousLogoUrl) {
      const media = await prisma.media.findFirst({
        where: { url: nextLogoUrl, type: "image" },
        select: { id: true },
      });
      if (!media) throw new Error("Choisissez un logo intégré, importé ou depuis votre ordinateur.");
    }

    await prisma.setting.upsert({
      where: { key: "logoUrl" },
      create: { key: "logoUrl", value: nextLogoUrl },
      update: { value: nextLogoUrl },
    });
  } catch (error) {
    if (uploadedLogo) {
      await cleanupFailedContentImages([uploadedLogo], error);
    }
    throw error;
  }
  if (previousLogoUrl && previousLogoUrl !== nextLogoUrl) {
    await removeUnusedContentImage(previousLogoUrl);
  }
  await recordUserActivity(session, "Modification", "Logo du site");
  revalidatePath("/", "layout");
  revalidatePath("/admin/personnalisation");
  redirect(getAdminPath("/admin/personnalisation?saved=logo", "ADMIN"));
}

export async function createMediaAction(formData: FormData) {
  const session = await requireSession();
  const parsed = z.object({
    url: z.union([z.url().max(2048), z.literal("")]),
    altText: z.string().trim().max(240).optional(),
  }).safeParse({
    url: formData.get("url") ?? "",
    altText: formData.get("altText") || undefined,
  });
  if (!parsed.success) throw new Error("Indiquez une URL d’image valide.");

  const upload = formData.get("file");
  let url = parsed.data.url;
  let uploadedFilePath: string | undefined;
  if (upload instanceof File && upload.size > 0) {
    const extensionByType: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const extension = extensionByType[upload.type];
    if (!extension) throw new Error("Format non pris en charge. Utilisez JPEG, PNG ou WebP.");
    if (upload.size > 5 * 1024 * 1024) throw new Error("L’image ne doit pas dépasser 5 Mo.");

    const buffer = Buffer.from(await upload.arrayBuffer());
    const validSignature =
      (upload.type === "image/jpeg" && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) ||
      (upload.type === "image/png" && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
      (upload.type === "image/webp" && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP");
    if (!validSignature) throw new Error("Le fichier n’est pas une image valide de ce format.");

    const uploadDirectory = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDirectory, { recursive: true });
    const filename = `${randomUUID()}.${extension}`;
    uploadedFilePath = join(uploadDirectory, filename);
    await writeFile(uploadedFilePath, buffer, { flag: "wx" });
    url = `/uploads/${filename}`;
  }
  if (!url) throw new Error("Choisissez une image ou indiquez son URL.");
  if (!url.startsWith("/uploads/")) {
    const protocol = new URL(url).protocol;
    if (protocol !== "https:" && protocol !== "http:") {
      throw new Error("Le lien de l’image doit utiliser HTTPS ou HTTP.");
    }
  }
  const uploadedPreview = await saveContentImage(formData.get("previewImageFile"));

  try {
    await prisma.media.create({
      data: {
        url,
        previewImage: uploadedPreview?.url ?? null,
        altText: parsed.data.altText,
        type: "image",
        uploadedById: session.userId,
      },
    });
  } catch (error) {
    const cleanupErrors: unknown[] = [];
    if (uploadedFilePath) {
      try {
        await unlink(uploadedFilePath);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    }
    if (uploadedPreview) {
      try {
        await unlink(uploadedPreview.filePath);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    }
    if (cleanupErrors.length) {
      throw new AggregateError(
        [error, ...cleanupErrors],
        "Impossible d’enregistrer le média et de nettoyer ses fichiers temporaires.",
      );
    }
    throw error;
  }
  await recordUserActivity(
    session,
    "Création",
    `Image de la galerie${parsed.data.altText ? ` : ${parsed.data.altText}` : ""}`,
  );
  revalidatePath("/galerie");
  revalidatePath("/admin/galerie");
  redirect(getAdminPath("/admin/galerie?created=1", session.role));
}

export async function updateMediaAction(formData: FormData) {
  const session = await requireSession();
  const parsed = z.object({
    id: z.string().cuid(),
    url: z.string().trim().min(1).max(2048).refine((value) => {
      if (value.startsWith("/uploads/")) {
        return /^\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) && !value.includes("..");
      }
      try {
        const protocol = new URL(value).protocol;
        return protocol === "https:" || protocol === "http:";
      } catch {
        return false;
      }
    }),
    altText: z.string().trim().max(240),
  }).safeParse({
    id: formData.get("id"),
    url: formData.get("url"),
    altText: formData.get("altText") ?? "",
  });
  if (!parsed.success) throw new Error("Indiquez un lien d’image HTTP ou HTTPS valide.");

  const media = await prisma.media.findUnique({ where: { id: parsed.data.id } });
  if (!media || (session.role !== "ADMIN" && media.uploadedById !== session.userId)) {
    throw new Error("Vous n’êtes pas autorisé à modifier cette image.");
  }
  const usedBySite = await prisma.setting.count({
    where: { key: { in: siteImageSettingKeys }, value: media.url },
  });
  if (usedBySite > 0 && session.role !== "ADMIN") {
    throw new Error("Cette image est utilisée par le site. Seul un administrateur peut la modifier.");
  }

  const uploadedPreview = await saveContentImage(formData.get("previewImageFile"));
  const removePreview = formData.get("removePreviewImage") === "on";
  const nextPreviewImage =
    uploadedPreview?.url ?? (removePreview ? null : media.previewImage);

  try {
    await prisma.$transaction([
      prisma.media.update({
        where: { id: media.id },
        data: {
          url: parsed.data.url,
          previewImage: nextPreviewImage,
          altText: parsed.data.altText || null,
        },
      }),
      prisma.setting.updateMany({
        where: {
          key: { in: siteImageSettingKeys },
          value: media.url,
        },
        data: { value: parsed.data.url },
      }),
    ]);
  } catch (error) {
    await cleanupFailedContentImages([uploadedPreview], error);
  }
  if (media.previewImage && media.previewImage !== nextPreviewImage) {
    await removeUnusedContentImage(media.previewImage);
  }

  await recordUserActivity(
    session,
    "Modification",
    `Image de la galerie${parsed.data.altText ? ` : ${parsed.data.altText}` : ""}`,
  );
  revalidatePath("/", "layout");
  revalidatePath("/galerie");
  revalidatePath("/admin/galerie");
  revalidatePath("/admin/personnalisation");
  redirect(getAdminPath("/admin/galerie?updated=1", session.role));
}

export async function deleteMediaAction(formData: FormData) {
  const session = await requireSession();
  const id = z.string().cuid().parse(formData.get("id"));
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media || (session.role !== "ADMIN" && media.uploadedById !== session.userId)) {
    throw new Error("Vous n’êtes pas autorisé à supprimer cette image.");
  }
  const activeSiteImage = await prisma.setting.findFirst({
    where: {
      key: { in: siteImageSettingKeys },
      value: media.url,
    },
    select: { key: true },
  });
  if (activeSiteImage) {
    throw new Error("Cette image est utilisée par le site. Remplacez-la dans Personnalisation avant de la supprimer.");
  }
  let uploadedFilePath: string | undefined;
  if (media.url.startsWith("/uploads/")) {
    const filename = basename(media.url);
    if (filename !== media.url.slice("/uploads/".length)) {
      throw new Error("Le chemin du média est invalide.");
    }
    uploadedFilePath = join(process.cwd(), "public", "uploads", filename);
  }
  await prisma.media.delete({ where: { id } });
  if (uploadedFilePath) {
    await unlink(uploadedFilePath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
  await removeUnusedContentImage(media.previewImage);
  await recordUserActivity(
    session,
    "Suppression",
    `Image de la galerie${media.altText ? ` : ${media.altText}` : ""}`,
  );
  revalidatePath("/galerie");
  revalidatePath("/admin/galerie");
}

export async function deleteContentAction(formData: FormData) {
  const session = await requireSession();
  const parsed = z.object({
    kind: z.enum(["activites", "annonces", "projets"]),
    id: z.string().cuid(),
  }).parse({
    kind: formData.get("kind"),
    id: formData.get("id"),
  });

  const item =
    parsed.kind === "activites"
      ? await prisma.activity.findUnique({ where: { id: parsed.id } })
      : parsed.kind === "annonces"
        ? await prisma.announcement.findUnique({ where: { id: parsed.id } })
        : await prisma.project.findUnique({ where: { id: parsed.id } });
  if (!item || (session.role !== "ADMIN" && item.authorId !== session.userId)) {
    throw new Error("Vous n’êtes pas autorisé à supprimer cette publication.");
  }

  if (parsed.kind === "activites") {
    await prisma.activity.delete({ where: { id: parsed.id } });
  } else if (parsed.kind === "annonces") {
    await prisma.announcement.delete({ where: { id: parsed.id } });
  } else {
    await prisma.project.delete({ where: { id: parsed.id } });
  }
  await removeUnusedContentImage(item.image);
  await removeUnusedContentImage(item.previewImage);
  const contentLabels = {
    activites: "Activité",
    annonces: "Annonce",
    projets: "Projet",
  } as const;
  await recordUserActivity(
    session,
    "Suppression",
    `${contentLabels[parsed.kind]} : ${item.title}`,
  );
  revalidatePath("/");
  revalidatePath(`/${parsed.kind}`);
  revalidatePath(`/admin/${parsed.kind}`);
  revalidatePath("/admin");
}
