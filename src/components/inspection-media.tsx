import { isVideoMediaUrl, resolveMediaUrl } from "@/lib/mediaUrl.ts";

export function InspectionMediaGallery({
  urls,
  altPrefix,
  thumbClassName,
}: {
  urls: string[];
  altPrefix: string;
  thumbClassName?: string;
}) {
  const thumb =
    thumbClassName ??
    "h-16 w-24 object-cover rounded-xl hover:opacity-80 transition-opacity border border-border/30";

  return (
    <div className="flex gap-2 flex-wrap">
      {urls.map((url, i) => {
        const src = resolveMediaUrl(url);
        return isVideoMediaUrl(url) ? (
          <video
            key={`${url}-${i}`}
            src={src}
            controls
            playsInline
            preload="metadata"
            className={`${thumb} bg-black cursor-pointer`}
          />
        ) : (
          <a key={`${url}-${i}`} href={src} target="_blank" rel="noopener noreferrer">
            <img
              src={src}
              alt={`${altPrefix} ${i + 1}`}
              className={`${thumb} cursor-pointer`}
            />
          </a>
        );
      })}
    </div>
  );
}
