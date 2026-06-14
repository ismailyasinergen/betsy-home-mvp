"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BusinessRequestMediaItem } from "@/lib/business-request-media";

const MAX_VIDEO_SECONDS = 180;
const MAX_FILES = 8;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

type PreviewItem = {
  signature: string;
  name: string;
  objectUrl: string;
  kind: "image" | "video";
  size: number;
  duration?: number;
  progress: number;
  status: "uploading" | "uploaded" | "error";
  error?: string;
  media?: BusinessRequestMediaItem;
};

function fileSignature(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function safeFilename(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || `reference-${Date.now()}`
  );
}

export function BusinessRequestMediaInput() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadingRef = useRef(false);
  const [message, setMessage] = useState("");
  const [previews, setPreviews] = useState<PreviewItem[]>([]);

  const uploadedMedia = useMemo(
    () =>
      previews.flatMap((item) =>
        item.status === "uploaded" && item.media ? [item.media] : []
      ),
    [previews]
  );

  useEffect(() => {
    uploadingRef.current = previews.some((item) => item.status === "uploading");
  }, [previews]);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;

    function blockSubmitWhileUploading(event: SubmitEvent) {
      if (uploadingRef.current) {
        event.preventDefault();
        setMessage("Please wait until all reference files finish uploading.");
      }
    }

    form.addEventListener("submit", blockSubmitWhileUploading);
    return () => form.removeEventListener("submit", blockSubmitWhileUploading);
  }, []);

  useEffect(() => {
    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.objectUrl));
    };
  }, [previews]);

  async function handleFiles(fileList: FileList | null) {
    setMessage("");

    if (!fileList || fileList.length === 0) return;

    const existingSignatures = new Set(previews.map((item) => item.signature));
    const incomingFiles = Array.from(fileList).filter(
      (file) => !existingSignatures.has(fileSignature(file))
    );

    if (previews.length + incomingFiles.length > MAX_FILES) {
      setMessage(`You can upload up to ${MAX_FILES} reference files.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    for (const file of incomingFiles) {
      await addAndUploadFile(file);
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  async function addAndUploadFile(file: File) {
    const validation = await validateFile(file);

    if (!validation.ok) {
      setMessage(validation.message);
      return;
    }

    const signature = fileSignature(file);
    const objectUrl = URL.createObjectURL(file);
    const kind = file.type.startsWith("video/") ? "video" : "image";
    const duration = kind === "video" ? await getVideoDuration(file, objectUrl) : undefined;

    setPreviews((items) => [
      ...items,
      {
        signature,
        name: file.name,
        objectUrl,
        kind,
        size: file.size,
        duration,
        progress: 0,
        status: "uploading"
      }
    ]);

    setMessage("Uploading reference files...");

    try {
      const blob = await upload(
        `business-requests/${Date.now()}-${safeFilename(file.name)}`,
        file,
        {
          access: "public",
          handleUploadUrl: "/api/business-request-media/upload",
          multipart: file.size > 4.5 * 1024 * 1024,
          contentType: file.type,
          onUploadProgress(event: any) {
            const percentage =
              typeof event.percentage === "number"
                ? event.percentage
                : event.total
                  ? (event.loaded / event.total) * 100
                  : 0;

            setPreviews((items) =>
              items.map((item) =>
                item.signature === signature
                  ? { ...item, progress: Math.round(percentage) }
                  : item
              )
            );
          }
        }
      );

      const media: BusinessRequestMediaItem = {
        url: blob.url,
        pathname: blob.pathname,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        kind
      };

      setPreviews((items) =>
        items.map((item) =>
          item.signature === signature
            ? { ...item, status: "uploaded", progress: 100, media }
            : item
        )
      );

      setMessage("Reference files uploaded. You can submit the request.");
    } catch (error) {
      setPreviews((items) =>
        items.map((item) =>
          item.signature === signature
            ? {
                ...item,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed"
              }
            : item
        )
      );

      setMessage("One file failed to upload. Remove it or try again.");
    }
  }

  async function validateFile(file: File) {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return { ok: false, message: "Only image and video reference files are allowed." };
    }

    if (file.type.startsWith("image/") && file.size > MAX_IMAGE_BYTES) {
      return { ok: false, message: `${file.name} is larger than 10MB.` };
    }

    if (file.type.startsWith("video/") && file.size > MAX_VIDEO_BYTES) {
      return { ok: false, message: `${file.name} is larger than 100MB.` };
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

    return { ok: true, message: "" };
  }

  function removeFile(signature: string) {
    const removed = previews.find((item) => item.signature === signature);
    if (removed) URL.revokeObjectURL(removed.objectUrl);

    const next = previews.filter((item) => item.signature !== signature);
    setPreviews(next);

    setMessage(
      next.length > 0
        ? `${next.length} reference file${next.length === 1 ? "" : "s"} selected.`
        : ""
    );
  }

  function clearFiles() {
    previews.forEach((item) => URL.revokeObjectURL(item.objectUrl));
    setPreviews([]);
    setMessage("");

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-3xl border border-sand bg-cream p-5">
      <input
        type="hidden"
        name="referenceMediaJson"
        value={JSON.stringify(uploadedMedia)}
      />

      <label className="block">
        <span className="text-sm font-extrabold text-charcoal">
          Reference photos or videos
        </span>
        <span className="mt-1 block text-sm text-charcoal/60">
          Upload up to {MAX_FILES} reference files. You can select multiple files at once or add them one by one.
        </span>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(event) => handleFiles(event.target.files)}
          className="mt-4 block w-full rounded-2xl border border-sand bg-white px-4 py-3 text-sm"
        />
      </label>

      {message ? <p className="mt-3 text-sm font-bold text-clay">{message}</p> : null}

      {previews.length > 0 ? (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-extrabold text-charcoal">Selected references</p>

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
                  <img src={item.objectUrl} alt={item.name} className="h-40 w-full object-cover" />
                ) : (
                  <video
                    src={item.objectUrl}
                    controls
                    muted
                    preload="metadata"
                    className="h-40 w-full bg-black object-contain"
                  />
                )}

                <div className="p-3">
                  <p className="truncate text-sm font-bold text-charcoal">{item.name}</p>
                  <p className="mt-1 text-xs text-charcoal/50">
                    {formatBytes(item.size)}
                    {item.kind === "video" && item.duration ? ` · ${formatDuration(item.duration)}` : ""}
                  </p>

                  {item.status === "uploading" ? (
                    <div className="mt-3">
                      <div className="h-2 overflow-hidden rounded-full bg-sand">
                        <div className="h-full bg-clay" style={{ width: `${item.progress}%` }} />
                      </div>
                      <p className="mt-1 text-xs font-bold text-charcoal/60">
                        Uploading {item.progress}%
                      </p>
                    </div>
                  ) : null}

                  {item.status === "uploaded" ? (
                    <p className="mt-3 text-xs font-bold text-sage">Uploaded</p>
                  ) : null}

                  {item.status === "error" ? (
                    <p className="mt-3 text-xs font-bold text-red-600">{item.error}</p>
                  ) : null}

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
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(seconds: number) {
  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const rest = rounded % 60;

  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
