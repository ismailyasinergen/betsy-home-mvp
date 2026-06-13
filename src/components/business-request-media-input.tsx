"use client";

import { useRef, useState } from "react";

const MAX_VIDEO_SECONDS = 180;
const MAX_FILES = 8;

export function BusinessRequestMediaInput() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");

  async function validateFiles(files: FileList | null) {
    setMessage("");

    if (!files || files.length === 0) return;

    if (files.length > MAX_FILES) {
      setMessage(`You can upload up to ${MAX_FILES} reference files.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    for (const file of Array.from(files)) {
      if (file.type.startsWith("video/")) {
        const duration = await getVideoDuration(file);

        if (duration > MAX_VIDEO_SECONDS) {
          setMessage(`${file.name} is longer than 3 minutes. Please upload a shorter video.`);
          if (inputRef.current) inputRef.current.value = "";
          return;
        }
      }
    }

    setMessage(`${files.length} reference file${files.length === 1 ? "" : "s"} selected.`);
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

      <p className="mt-3 text-xs leading-5 text-charcoal/50">
        Supported: images and videos. Images up to 10MB each. Videos up to 100MB each and 3 minutes long.
      </p>
    </div>
  );
}

function getVideoDuration(file: File) {
  return new Promise<number>((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration || 0);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };

    video.src = url;
  });
}
