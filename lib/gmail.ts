import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const settingKey = "gmailSmtpConfig";

const configurationSchema = z.object({
  account: z.email(),
  appPassword: z.string().min(1),
  allowedFrom: z.array(z.email()),
});

export type GmailConfiguration = z.infer<typeof configurationSchema>;

function getEncryptionKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET doit contenir au moins 32 caractères pour protéger la configuration Gmail.");
  }
  return createHash("sha256").update(secret).digest();
}

function encryptConfiguration(configuration: GmailConfiguration) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(configuration), "utf8"),
    cipher.final(),
  ]);
  return [
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

function decryptConfiguration(value: string): GmailConfiguration {
  const [encodedIv, encodedTag, encodedCiphertext, ...extra] = value.split(".");
  if (!encodedIv || !encodedTag || !encodedCiphertext || extra.length) {
    throw new Error("La configuration Gmail enregistrée est illisible.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(encodedIv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
  const parsed = configurationSchema.safeParse(JSON.parse(plaintext));
  if (!parsed.success) {
    throw new Error("La configuration Gmail enregistrée est invalide.");
  }
  return parsed.data;
}

function getEnvironmentGmailConfiguration(): GmailConfiguration | null {
  const account = process.env.GMAIL_USER?.trim().toLowerCase();
  const appPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!account || !appPassword) return null;

  return {
    account,
    appPassword,
    allowedFrom: (process.env.GMAIL_ALLOWED_FROM ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  };
}

export async function getGmailConfiguration(): Promise<GmailConfiguration | null> {
  const setting = await prisma.setting.findUnique({
    where: { key: settingKey },
    select: { value: true },
  });
  if (setting) {
    try {
      return decryptConfiguration(setting.value);
    } catch (error) {
      // Un changement d’AUTH_SECRET ou une valeur corrompue ne doit pas faire
      // tomber tout le formulaire de contact : on retombe sur la configuration
      // d’environnement et l’administrateur peut réenregistrer ses réglages.
      console.warn(
        "La configuration Gmail enregistrée est illisible ; utilisation de la configuration d’environnement.",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return getEnvironmentGmailConfiguration();
}

export async function getGmailConfigurationStatus() {
  const configuration = await getGmailConfiguration();
  return configuration
    ? {
        configured: true,
        account: configuration.account,
        allowedFrom: configuration.allowedFrom,
      }
    : { configured: false, account: "", allowedFrom: [] };
}

export async function saveGmailConfiguration(configuration: GmailConfiguration) {
  const value = encryptConfiguration(configuration);
  await prisma.setting.upsert({
    where: { key: settingKey },
    update: { value },
    create: { key: settingKey, value },
  });
}

function createTransporter(configuration: GmailConfiguration) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: configuration.account,
      pass: configuration.appPassword,
    },
  });
}

export async function verifyGmailConfiguration(configuration: GmailConfiguration) {
  await createTransporter(configuration).verify();
}

export async function sendGmailMessage({
  fromName,
  fromEmail,
  to,
  subject,
  text,
}: {
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  text: string;
}) {
  const configuration = await getGmailConfiguration();
  if (!configuration) throw new Error("GMAIL_CONFIGURATION_MISSING");

  const normalizedFromEmail = fromEmail.trim().toLowerCase();
  const allowedFrom = new Set([
    configuration.account,
    ...configuration.allowedFrom,
  ]);
  if (!allowedFrom.has(normalizedFromEmail)) {
    throw new Error("GMAIL_SENDER_NOT_ALLOWED");
  }

  await createTransporter(configuration).sendMail({
    from: { name: fromName, address: normalizedFromEmail },
    to,
    subject,
    text,
  });
}
