import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { del, put } from "@vercel/blob";

const localUploadDirectory = join(process.cwd(), "public", "uploads");
const blobHostSuffix = ".public.blob.vercel-storage.com";

export type StoredImage = {
  url: string;
  remove: () => Promise<void>;
};

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

function isBlobImageUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(blobHostSuffix);
  } catch {
    return false;
  }
}

/** Une image gérée par le site : fichier local en développement ou objet Vercel Blob en production. */
export function isStoredImageUrl(url: string | null | undefined) {
  return Boolean(url) && (url!.startsWith("/uploads/") || isBlobImageUrl(url!));
}

export async function storeImage(
  buffer: Buffer,
  extension: string,
  contentType: string,
): Promise<StoredImage> {
  const filename = `${randomUUID()}.${extension}`;
  const token = blobToken();

  if (token) {
    const blob = await put(`uploads/${filename}`, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      token,
    });
    return {
      url: blob.url,
      remove: () => del(blob.url, { token }),
    };
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Le stockage des images n’est pas configuré. Ajoutez la variable BLOB_READ_WRITE_TOKEN dans Vercel.",
    );
  }

  await mkdir(localUploadDirectory, { recursive: true });
  const filePath = join(localUploadDirectory, filename);
  await writeFile(filePath, buffer, { flag: "wx" });
  return {
    url: `/uploads/${filename}`,
    remove: () => unlink(filePath),
  };
}

export async function deleteStoredImage(url: string | null | undefined) {
  if (!url) return;

  if (isBlobImageUrl(url)) {
    const token = blobToken();
    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN est requis pour supprimer une image distante.");
    }
    await del(url, { token });
    return;
  }

  if (!url.startsWith("/uploads/")) return;

  const filename = url.slice("/uploads/".length);
  if (!filename || filename.includes("..") || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(filename)) {
    return;
  }

  await unlink(join(localUploadDirectory, filename)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}
