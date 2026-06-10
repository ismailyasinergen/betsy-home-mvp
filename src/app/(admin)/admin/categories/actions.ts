"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

function getName(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Name is required.");
  }
  return name;
}

export async function createCategory(formData: FormData) {
  const name = getName(formData);
  const slug = slugify(name);

  await prisma.category.upsert({
    where: { slug },
    update: { name },
    create: { name, slug }
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function createRoom(formData: FormData) {
  const name = getName(formData);
  const slug = slugify(name);

  await prisma.room.upsert({
    where: { slug },
    update: { name },
    create: { name, slug }
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function createStyle(formData: FormData) {
  const name = getName(formData);
  const slug = slugify(name);

  await prisma.style.upsert({
    where: { slug },
    update: { name },
    create: { name, slug }
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
}
