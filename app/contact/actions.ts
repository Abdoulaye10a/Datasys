"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type ContactState = {
  error?: string;
  success?: string;
};

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  subject: z.string().trim().min(3).max(140),
  message: z.string().trim().min(10).max(4000),
  website: z.string().max(0),
});

export async function sendContactMessage(
  _previousState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    website: formData.get("website") ?? "",
  });
  if (!parsed.success) {
    return { error: "Vérifiez les champs : le message doit contenir au moins 10 caractères." };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const recentMessage = await prisma.message.findFirst({
    where: { email, createdAt: { gte: new Date(Date.now() - 60_000) } },
    select: { id: true },
  });
  if (recentMessage) {
    return { error: "Un message vient déjà d’être envoyé avec cette adresse. Réessayez dans une minute." };
  }

  await prisma.message.create({
    data: {
      name: parsed.data.name,
      email,
      subject: parsed.data.subject,
      message: parsed.data.message,
    },
  });
  revalidatePath("/admin");
  return { success: "Merci, votre message a bien été transmis à l’équipe DATASYS." };
}
