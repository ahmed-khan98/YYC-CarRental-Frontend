import { isVideoMediaUrl, resolveMediaUrl } from "@/lib/mediaUrl.ts";
import { cn } from "@/lib/utils.ts";

export function InspectionMediaGallery({
  urls,
  altPrefix,
  thumbClassName,
  gridClassName,
}: {
  urls: string[];
  altPrefix: string;
  thumbClassName?: string;
  gridClassName?: string;
}) {
  const thumb = cn(
    "h-auto w-full aspect-[4/3] object-cover rounded-lg border border-border/30 hover:opacity-80 transition-opacity",
    thumbClassName,
  );

  return (
    <div className={cn("grid grid-cols-3 gap-1.5", gridClassName)}>
      {urls.map((url, i) => {
        const src = resolveMediaUrl(url);
        return isVideoMediaUrl(url) ? (
          <video
            key={`${url}-${i}`}
            src={src}
            controls
            playsInline
            preload="metadata"
            className={cn(thumb, "bg-black cursor-pointer")}
          />
        ) : (
          <a key={`${url}-${i}`} href={src} target="_blank" rel="noopener noreferrer" className="min-w-0">
            <img
              src={src}
              alt={`${altPrefix} ${i + 1}`}
              className={cn(thumb, "cursor-pointer")}
            />
          </a>
        );
      })}
    </div>
  );
}
