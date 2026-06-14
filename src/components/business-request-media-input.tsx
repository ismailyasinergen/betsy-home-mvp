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
  signature: string;
};

function fileSignature(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function BusinessRequestMediaInput() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);

  useEffect(() => {
    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previews]);

  async function handleFiles(fileList: FileList | null) {
    setMessage("");

    if (!fileList || fileList.length === 0) return;

    const incomingFiles = Array.from(fileList);
    const existingSignatures = new Set(selectedFiles.map(fileSignature));

    const mergedFiles = [
      ...selectedFiles,
      ...incomingFiles.filter((file) => !existingSignatures.has(fileSignature(file)))
    ];

    if (mergedFiles.length > MAX_FILES) {
      setMessage(`You can upload up to ${MAX_FILES} reference files.`);
      syncInputFiles(selectedFiles);
      return;
    }

    const validation = await validateFiles(mergedFiles);

    if (!validation.ok) {
      setMessage(validation.message);
      syncInputFiles(selectedFiles);
      return;
    }

    previews.forEach((item) => URL.revokeObjectURL(item.url));

    const nextPreviews = await Promise.all(
      mergedFiles.map(async (file) => {
        const url = URL.createObjectURL(file);
        const isVideo = file.type.startsWith("video/");
        const duration = isVideo ? await getVideoDuration(file, url) : undefined;

        return {
          name: file.name,
          url,
          kind: isVideo ? "video" as const : "image" as const,
          size: file.size,
          duration,
          signature: fileSignature(file)
        };
      })
    );

    setSelectedFiles(mergedFiles);
    setPreviews(nextPreviews);
    syncInputFiles(mergedFiles);

    setMessage(
      `${mergedFiles.length} reference file${mergedFiles.length === 1 ? "" : "s"} selected.`
    );
  }

  async function validateFiles(files: File[]) {
    for (const file of files) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        return {
          ok: false,
          message: "Only image and video reference files are allowed."
        };
      }

      if (file.type.startsWith("video/")) {
        const duration = await getVideoDuration(file);

        if (duration > MAX_VIDEO_SECONDS) {
          return {
            ok: false,
            message: `${file.name} is longer than 3 minutes. Please upload a shorter video.`
          };
        }
      }
    }

    return { ok: true, message: "" };
  }

  function syncInputFiles(files: File[]) {
    if (!inputRef.current) return;

    const dataTransfer = new DataTransfer();

    for (const file of files) {
      dataTransfer.items.add(file);
    }

    inputRef.current.files = dataTransfer.files;
  }

  function removeFile(signature: string) {
    const remainingFiles = selectedFiles.filter(
      (file) => fileSignature(file) !== signature
    );

    const removedPreview = previews.find((item) => item.signature === signature);
    if (removedPreview) {
      URL.revokeObjectURL(removedPreview.url);
    }

    const remainingPreviews = previews.filter((item) => item.signature !== signature);

    setSelectedFiles(remainingFiles);
    setPreviews(remainingPreviews);
    syncInputFiles(remainingFiles);

    setMessage(
      remainingFiles.length > 0
        ? `${remainingFiles.length} reference file${remainingFiles.length === 1 ? "" : "s"} selected.`
        : ""
    );
  }

  function clearFiles() {
    previews.forEach((item) => URL.revokeObjectURL(item.url));
    setSelectedFiles([]);
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
          Upload up to {MAX_FILES} reference files. You can select multiple files at once or add them one by one.
        </span>

        <input
          ref={inputRef}
          name="referenceMediaFiles"
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(event) => handleFiles(event.target.files)}
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
              Clear all
            </button>
          </div>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {previews.map((item) => (
              <div
                key={item.signature}
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

                  <button
                    type="button"
                    onClick={() => removeFile(item.signature)}
                    className="mt-3 rounded-full border border-red-200 px-3 py-1 text-xs font-bold text-red-600"
                  >
                    Remove
                  </button>
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
