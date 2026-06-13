import { put } from "@vercel/blob";

export type BusinessRequestMediaItem = {
  url: string;
  pathname: string;
  filename: string;
  contentType: string;
  size: number;
  kind: "image" | "video";
};

const MAX_FILES = 8;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function safeFilename(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || `reference-${Date.now()}`;
}

function mediaKind(contentType: string): "image" | "video" | null {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  return null;
}

export async function uploadBusinessRequestMedia(formData: FormData) {
  const files = formData
    .getAll("referenceMediaFiles")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) return [];

  if (files.length > MAX_FILES) {
    throw new Error(`You can upload up to ${MAX_FILES} reference files.`);
  }

  const uploaded: BusinessRequestMediaItem[] = [];

  for (const file of files) {
    const kind = mediaKind(file.type);

    if (!kind) {
      throw new Error("Only image and video reference files are allowed.");
    }

    if (kind === "image" && file.size > MAX_IMAGE_BYTES) {
      throw new Error("Each image must be 10MB or smaller.");
    }

    if (kind === "video" && file.size > MAX_VIDEO_BYTES) {
      throw new Error("Each video must be 100MB or smaller.");
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("File uploads need Vercel Blob. Add BLOB_READ_WRITE_TOKEN in Vercel first.");
    }

    const blob = await put(
      `business-requests/${Date.now()}-${safeFilename(file.name)}`,
      file,
      {
        access: "public",
        addRandomSuffix: true
      }
    );

    uploaded.push({
      url: blob.url,
      pathname: blob.pathname,
      filename: file.name,
      contentType: file.type,
      size: file.size,
      kind
    });
  }

  return uploaded;
}

export function parseBusinessRequestMedia(value: unknown): BusinessRequestMediaItem[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is BusinessRequestMediaItem => {
    return Boolean(
      item &&
      typeof item === "object" &&
      "url" in item &&
      "kind" in item &&
      typeof (item as any).url === "string" &&
      ((item as any).kind === "image" || (item as any).kind === "video")
    );
  });
}
