import Link from "next/link";
import { parseBusinessRequestMedia } from "@/lib/business-request-media";

export function ReferenceMediaGallery({
  media,
  className = ""
}: {
  media: unknown;
  className?: string;
}) {
  const items = parseBusinessRequestMedia(media);

  if (items.length === 0) return null;

  return (
    <div className={className}>
      <p className="text-sm font-extrabold text-charcoal">Reference media</p>

      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.url} className="overflow-hidden rounded-3xl border border-sand bg-white shadow-sm">
            {item.kind === "image" ? (
              <img
                src={item.url}
                alt={item.filename || "Business request reference"}
                className="h-44 w-full object-cover"
              />
            ) : (
              <video
                src={item.url}
                controls
                preload="metadata"
                className="h-44 w-full bg-black object-contain"
              />
            )}

            <div className="p-4">
              <p className="truncate text-sm font-bold text-charcoal">
                {item.filename || "Reference file"}
              </p>
              <Link
                href={item.url}
                target="_blank"
                className="mt-2 inline-flex text-xs font-bold text-clay"
              >
                Open file
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
