"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addProductToMoodBoard,
  createMoodBoard,
  deleteMoodBoard,
  removeProductFromMoodBoard,
  setMoodBoardPublicStatus
} from "@/lib/mood-boards";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function revalidateMoodBoardPages() {
  revalidatePath("/account");
  revalidatePath("/account/mood-boards");
  revalidatePath("/boards");
  revalidatePath("/product/[slug]", "page");
}

export async function createMoodBoardAction(formData: FormData) {
  const title = clean(formData.get("title"));
  const description = clean(formData.get("description"));
  const isPublic = formData.get("isPublic") === "on";

  if (!title) {
    return;
  }

  const board = await createMoodBoard({
    title,
    description,
    isPublic
  });

  revalidateMoodBoardPages();
  redirect(`/account/mood-boards/${board.id}`);
}

export async function addProductToMoodBoardAction(formData: FormData) {
  const boardId = clean(formData.get("boardId"));
  const productId = clean(formData.get("productId"));
  const returnTo = clean(formData.get("returnTo"));

  if (!boardId || !productId) {
    return;
  }

  await addProductToMoodBoard({ boardId, productId });
  revalidateMoodBoardPages();
  revalidatePath(`/account/mood-boards/${boardId}`);

  if (returnTo) {
    redirect(returnTo);
  }

  redirect(`/account/mood-boards/${boardId}`);
}

export async function removeProductFromMoodBoardAction(formData: FormData) {
  const boardId = clean(formData.get("boardId"));
  const productId = clean(formData.get("productId"));
  const returnTo = clean(formData.get("returnTo"));

  if (!boardId || !productId) {
    return;
  }

  await removeProductFromMoodBoard({ boardId, productId });
  revalidateMoodBoardPages();
  revalidatePath(`/account/mood-boards/${boardId}`);

  if (returnTo) {
    redirect(returnTo);
  }

  redirect(`/account/mood-boards/${boardId}`);
}

export async function setMoodBoardPublicStatusAction(formData: FormData) {
  const boardId = clean(formData.get("boardId"));
  const isPublic = formData.get("isPublic") === "on";

  if (!boardId) {
    return;
  }

  await setMoodBoardPublicStatus({ boardId, isPublic });
  revalidateMoodBoardPages();
  revalidatePath(`/account/mood-boards/${boardId}`);
  revalidatePath(`/boards/${boardId}`);
  redirect(`/account/mood-boards/${boardId}`);
}

export async function deleteMoodBoardAction(formData: FormData) {
  const boardId = clean(formData.get("boardId"));

  if (!boardId) {
    return;
  }

  await deleteMoodBoard(boardId);
  revalidateMoodBoardPages();
  revalidatePath(`/account/mood-boards/${boardId}`);
  revalidatePath(`/boards/${boardId}`);
  redirect("/account/mood-boards");
}
