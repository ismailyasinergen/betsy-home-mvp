"use server";

import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(baseSlug: string, currentId?: string) {
  let slug = slugify(baseSlug) || "category";
  let attempt = slug;
  let index = 2;

  while (true) {
    const existing = await prisma.category.findUnique({
      where: { slug: attempt },
      select: { id: true }
    });

    if (!existing || existing.id === currentId) {
      return attempt;
    }

    attempt = `${slug}-${index}`;
    index += 1;
  }
}

async function getDescendantIds(categoryId: string) {
  const result = new Set<string>();
  const stack = [categoryId];

  while (stack.length > 0) {
    const parentId = stack.pop()!;
    const children = await prisma.category.findMany({
      where: { parentId },
      select: { id: true }
    });

    for (const child of children) {
      if (!result.has(child.id)) {
        result.add(child.id);
        stack.push(child.id);
      }
    }
  }

  result.delete(categoryId);
  return result;
}

async function assertAdmin() {
  await requireRole([UserRole.ADMIN], "/admin/categories");
}

export async function createCategory(formData: FormData) {
  await assertAdmin();

  const name = text(formData, "name");
  const rawSlug = text(formData, "slug") || name;
  const imageUrl = optionalText(formData, "imageUrl");
  const parentId = optionalText(formData, "parentId");

  if (!name) {
    redirect("/admin/categories?error=missing-name");
  }

  const slug = await uniqueSlug(rawSlug);

  await prisma.category.create({
    data: {
      name,
      slug,
      imageUrl,
      parentId
    }
  });

  revalidatePath("/admin/categories");
  revalidatePath("/category/[slug]", "page");

  redirect("/admin/categories?created=1");
}

export async function updateCategory(categoryId: string, formData: FormData) {
  await assertAdmin();

  const name = text(formData, "name");
  const rawSlug = text(formData, "slug") || name;
  const imageUrl = optionalText(formData, "imageUrl");
  const parentId = optionalText(formData, "parentId");

  if (!name) {
    redirect("/admin/categories?error=missing-name");
  }

  if (parentId === categoryId) {
    redirect("/admin/categories?error=self-parent");
  }

  if (parentId) {
    const descendants = await getDescendantIds(categoryId);
    if (descendants.has(parentId)) {
      redirect("/admin/categories?error=child-parent");
    }
  }

  const slug = await uniqueSlug(rawSlug, categoryId);

  await prisma.category.update({
    where: { id: categoryId },
    data: {
      name,
      slug,
      imageUrl,
      parentId
    }
  });

  revalidatePath("/admin/categories");
  revalidatePath("/category/[slug]", "page");

  redirect("/admin/categories?updated=1");
}

export async function moveCategory(categoryId: string, formData: FormData) {
  await assertAdmin();

  const parentId = optionalText(formData, "parentId");

  if (parentId === categoryId) {
    redirect("/admin/categories?error=self-parent");
  }

  if (parentId) {
    const descendants = await getDescendantIds(categoryId);
    if (descendants.has(parentId)) {
      redirect("/admin/categories?error=child-parent");
    }
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: { parentId }
  });

  revalidatePath("/admin/categories");
  revalidatePath("/category/[slug]", "page");

  redirect("/admin/categories?moved=1");
}

export async function deleteCategory(categoryId: string) {
  await assertAdmin();

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: {
          products: true,
          children: true
        }
      }
    }
  });

  if (!category) {
    redirect("/admin/categories?error=not-found");
  }

  if (category._count.products > 0) {
    redirect("/admin/categories?error=has-products");
  }

  if (category._count.children > 0) {
    redirect("/admin/categories?error=has-children");
  }

  await prisma.category.delete({
    where: { id: categoryId }
  });

  revalidatePath("/admin/categories");
  revalidatePath("/category/[slug]", "page");

  redirect("/admin/categories?deleted=1");
}
