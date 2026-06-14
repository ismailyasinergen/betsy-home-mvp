"use client";

import { useEffect, useRef, useState } from "react";

const MAX_VIDEO_SECONDS = 180;
const MAX_FILES = 8;

type PreviewItem = {
  name: string;
  url: string;
  kind: "image" | "video";
  size: number;
  duration?: number;
};

export function BusinessRequestMediaInput() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");
  const [previews, setPreviews] = useState<PreviewItem[]>([]);

  useEffect(() => {
    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previews]);

  async function validateFiles(files: FileList | null) {
    previews.forEach((item) => URL.revokeObjectURL(item.url));
    setPreviews([]);
    setMessage("");

    if (!files || files.length === 0) return;

    if (files.length > MAX_FILES) {
      setMessage(`You can upload up to ${MAX_FILES} reference files.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const nextPreviews: PreviewItem[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        setMessage("Only image and video reference files are allowed.");
        if (inputRef.current) inputRef.current.value = "";
        nextPreviews.forEach((item) => URL.revokeObjectURL(item.url));
        return;
      }

      const url = URL.createObjectURL(file);

      if (file.type.startsWith("video/")) {
        const duration = await getVideoDuration(file, url);

        if (duration > MAX_VIDEO_SECONDS) {
          setMessage(`${file.name} is longer than 3 minutes. Please upload a shorter video.`);
          if (inputRef.current) inputRef.current.value = "";
          URL.revokeObjectURL(url);
          nextPreviews.forEach((item) => URL.revokeObjectURL(item.url));
          return;
        }

        nextPreviews.push({
          name: file.name,
          url,
          kind: "video",
          size: file.size,
          duration
        });
      } else {
        nextPreviews.push({
          name: file.name,
          url,
          kind: "image",
          size: file.size
        });
      }
    }

    setPreviews(nextPreviews);
    setMessage(`${files.length} reference file${files.length === 1 ? "" : "s"} selected.`);
  }

  function clearFiles() {
    previews.forEach((item) => URL.revokeObjectURL(item.url));
    setPreviews([]);
    setMessage("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-3xl border border-sand bg-cream p-5">
      <label className="block">
        <span className="text-sm font-extrabold text-charcoal">
          Reference photos or videos
        </span>
        <span className="mt-1 block text-sm text-charcoal/60">
          Upload sample photos or videos. Videos must be 3 minutes or shorter.
        </span>

        <input
          ref={inputRef}
          name="referenceMediaFiles"
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(event) => validateFiles(event.target.files)}
          className="mt-4 block w-full rounded-2xl border border-sand bg-white px-4 py-3 text-sm"
        />
      </label>

      {message ? (
        <p className="mt-3 text-sm font-bold text-clay">{message}</p>
      ) : null}

      {previews.length > 0 ? (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-extrabold text-charcoal">
              Selected references
            </p>

            <button
              type="button"
              onClick={clearFiles}
              className="rounded-full border border-clay px-4 py-2 text-xs font-bold text-clay"
            >
              Clear files
            </button>
          </div>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {previews.map((item) => (
              <div
                key={item.url}
                className="overflow-hidden rounded-3xl border border-sand bg-white shadow-sm"
              >
                {item.kind === "image" ? (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <video
                    src={item.url}
                    controls
                    muted
                    preload="metadata"
                    className="h-40 w-full bg-black object-contain"
                  />
                )}

                <div className="p-3">
                  <p className="truncate text-sm font-bold text-charcoal">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-charcoal/50">
                    {formatBytes(item.size)}
                    {item.kind === "video" && item.duration
                      ? ` · ${formatDuration(item.duration)}`
                      : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-xs leading-5 text-charcoal/50">
        Supported: images and videos. Images up to 10MB each. Videos up to 100MB each and 3 minutes long.
      </p>
    </div>
  );
}

function getVideoDuration(file: File, existingUrl?: string) {
  return new Promise<number>((resolve) => {
    const video = document.createElement("video");
    const url = existingUrl ?? URL.createObjectURL(file);

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      if (!existingUrl) URL.revokeObjectURL(url);
      resolve(video.duration || 0);
    };

    video.onerror = () => {
      if (!existingUrl) URL.revokeObjectURL(url);
      resolve(0);
    };

    video.src = url;
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(seconds: number) {
  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const rest = rounded % 60;

  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
