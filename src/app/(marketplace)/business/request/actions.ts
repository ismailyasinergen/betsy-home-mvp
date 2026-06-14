"use server";

import { redirect } from "next/navigation";
import { requireSignedIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBusinessRequestMediaJson } from "@/lib/business-request-media";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createBusinessProjectRequest(formData: FormData) {
  const user = await requireSignedIn("/business/request");

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
    redirect("/business/request?error=missing");
  }

  const referenceMedia = parseBusinessRequestMediaJson(formData.get("referenceMediaJson"));

  const project = await prisma.businessProjectRequest.create({
    data: {
      buyerId: user.id,
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

  redirect(`/account/projects/${project.id}?created=1`);
}
