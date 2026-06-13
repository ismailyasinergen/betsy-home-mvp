"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSignedIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function updateBusinessProjectRequest(projectId: string, formData: FormData) {
  const user = await requireSignedIn(`/account/projects/${projectId}/edit`);

  const existing = await prisma.businessProjectRequest.findFirst({
    where: {
      id: projectId,
      buyerId: user.id
    },
    select: {
      id: true
    }
  });

  if (!existing) {
    redirect("/account/projects?error=not-found");
  }

  const projectName = text(formData, "projectName");
  const companyName = text(formData, "companyName");
  const businessType = text(formData, "businessType");
  const projectLocation = text(formData, "projectLocation");
  const neededBy = optionalDate(text(formData, "neededBy"));
  const budgetRange = text(formData, "budgetRange");
  const quantitySummary = text(formData, "quantitySummary");
  const message = text(formData, "message");
  const categories = text(formData, "categories")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!projectName || !quantitySummary || !message) {
    redirect(`/account/projects/${projectId}/edit?error=missing`);
  }

  await prisma.businessProjectRequest.update({
    where: {
      id: projectId
    },
    data: {
      projectName,
      companyName: companyName || null,
      businessType: businessType || null,
      projectLocation: projectLocation || null,
      neededBy,
      budgetRange: budgetRange || null,
      categories,
      quantitySummary,
      message
    }
  });

  revalidatePath("/account/projects");
  revalidatePath("/seller/project-requests");
  revalidatePath("/admin/project-requests");

  redirect(`/account/projects/${projectId}?updated=1`);
}
