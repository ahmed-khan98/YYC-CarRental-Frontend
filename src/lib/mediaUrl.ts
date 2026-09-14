const VIDEO_EXT = /\.(mp4|webm|mov|m4v|avi|mkv|ogv|ogg|3gp)(\?|#|$)/i;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i;

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (!url.startsWith("/uploads/")) return url;

  const api = import.meta.env.VITE_API_BASE_URL;
  if (api && /^https?:\/\//i.test(api)) {
    return `${api.replace(/\/api(?:\/v1)?\/?$/, "")}${url}`;
  }
  return url;
}

export function isVideoMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (/\/video\/upload\//i.test(url)) return true;
  try {
    return VIDEO_EXT.test(new URL(url, "https://local.invalid").pathname);
  } catch {
    return VIDEO_EXT.test(url);
  }
}

export function mediaKindFromFile(file: File): "image" | "video" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (IMAGE_EXT.test(file.name)) return "image";
  if (VIDEO_EXT.test(file.name)) return "video";
  return null;
}
