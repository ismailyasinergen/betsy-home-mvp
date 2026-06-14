export type BusinessRequestMediaItem = {
  url: string;
  pathname: string;
  filename: string;
  contentType: string;
  size: number;
  kind: "image" | "video";
};

export function parseBusinessRequestMedia(value: unknown): BusinessRequestMediaItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is BusinessRequestMediaItem => {
      return Boolean(
        item &&
          typeof item === "object" &&
          typeof (item as any).url === "string" &&
          typeof (item as any).pathname === "string" &&
          typeof (item as any).filename === "string" &&
          typeof (item as any).contentType === "string" &&
          typeof (item as any).size === "number" &&
          ((item as any).kind === "image" || (item as any).kind === "video")
      );
    })
    .slice(0, 8);
}

export function parseBusinessRequestMediaJson(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    return parseBusinessRequestMedia(JSON.parse(value));
  } catch {
    return [];
  }
}
