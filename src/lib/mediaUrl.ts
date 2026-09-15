import { API_ORIGIN } from "@/api/client.ts";

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|avi|mkv|ogv|ogg|3gp)(\?|#|$)/i;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i;

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (path.startsWith("/uploads/")) {
    return `${API_ORIGIN}${path}`;
  }
  return trimmed;
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

export function carImageUrls(car?: { imageUrls?: string[]; imageUrl?: string } | null): string[] {
  if (!car) return [];
  const raw = car.imageUrls?.length ? car.imageUrls : car.imageUrl ? [car.imageUrl] : [];
  return raw.map((url) => resolveMediaUrl(url)).filter(Boolean);
}

export function carPrimaryImage(
  car?: { imageUrls?: string[]; imageUrl?: string; category?: string } | null,
  fallback = "",
): string {
  return carImageUrls(car)[0] || fallback || "";
}

export function mediaKindFromFile(file: File): "image" | "video" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (IMAGE_EXT.test(file.name)) return "image";
  if (VIDEO_EXT.test(file.name)) return "video";
  return null;
}
