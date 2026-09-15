import { API_ORIGIN } from "@/api/client.ts";

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|avi|mkv|ogv|ogg|3gp)(\?|#|$)/i;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i;

export function isStoredMediaUrl(url?: string | null): boolean {
  if (!url?.trim()) return false;
  const value = url.trim();
  if (/^https?:\/\//i.test(value)) return true;
  const path = value.startsWith("/") ? value : `/${value}`;
  return path.startsWith("/uploads/");
}

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

export function inspectionMediaUrls(inspection?: {
  resolvedImageUrls?: string[];
  imageUrls?: string[];
} | null): string[] {
  const raw = inspection?.resolvedImageUrls?.length
    ? inspection.resolvedImageUrls
    : inspection?.imageUrls ?? [];
  return raw.map((url) => resolveMediaUrl(url)).filter(Boolean);
}

export function carPrimaryImage(
  car?: { imageUrls?: string[]; imageUrl?: string; category?: string } | null,
  fallback = "",
): string {
  return carImageUrls(car)[0] || fallback || "";
}

export function persistBrowserFile(file: File, fallbackName = "media"): File {
  const kind = mediaKindFromFile(file);
  const type =
    file.type ||
    (kind === "video" ? "video/mp4" : kind === "image" ? "image/jpeg" : "application/octet-stream");
  const name = file.name?.trim() || `${fallbackName}-${Date.now()}`;
  return new File([file], name, { type, lastModified: file.lastModified || Date.now() });
}

export function mediaKindFromFile(file: File): "image" | "video" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (IMAGE_EXT.test(file.name)) return "image";
  if (VIDEO_EXT.test(file.name)) return "video";
  return null;
}
