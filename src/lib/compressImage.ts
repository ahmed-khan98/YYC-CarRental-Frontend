import { mediaKindFromFile } from "@/lib/mediaUrl.ts";
import { isMobileBrowser } from "@/lib/openPdf.ts";

const DESKTOP_MAX_EDGE = 1280;
const MOBILE_MAX_EDGE = 960;
const DESKTOP_TARGET_BYTES = 450_000;
const MOBILE_TARGET_BYTES = 200_000;
const MIN_QUALITY = 0.45;

export type CompressImageOptions = {
  maxEdge?: number;
  targetBytes?: number;
};

export function defaultImageCompressOptions(): Required<CompressImageOptions> {
  return isMobileBrowser()
    ? { maxEdge: MOBILE_MAX_EDGE, targetBytes: MOBILE_TARGET_BYTES }
    : { maxEdge: DESKTOP_MAX_EDGE, targetBytes: DESKTOP_TARGET_BYTES };
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

function drawToCanvas(source: CanvasImageSource, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function scaledSize(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function jpegUnderTarget(canvas: HTMLCanvasElement, targetBytes: number, startQuality = 0.74) {
  let quality = startQuality;
  let blob = await canvasToJpeg(canvas, quality);
  while (blob && blob.size > targetBytes && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - 0.08);
    blob = await canvasToJpeg(canvas, quality);
  }
  return blob;
}

async function decodeImage(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}> {
  try {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  } catch {
    // Some Android/HEIC files only decode through an <img>.
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read this photo"));
      img.src = url;
    });
    return {
      source: image,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export async function snapshotVideoFrame(video: HTMLVideoElement, filename: string): Promise<File> {
  const options = defaultImageCompressOptions();
  const { width, height } = scaledSize(video.videoWidth, video.videoHeight, options.maxEdge);
  const canvas = drawToCanvas(video, width, height);
  if (!canvas) throw new Error("Could not capture photo");
  const blob = await jpegUnderTarget(canvas, options.targetBytes);
  if (!blob) throw new Error("Could not capture photo");
  return new File([blob], filename, { type: "image/jpeg", lastModified: Date.now() });
}

export async function compressImageForUpload(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const kind = mediaKindFromFile(file);
  if (kind === "video" || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }
  if (kind !== "image" && file.type) {
    return file;
  }

  const { maxEdge, targetBytes } = { ...defaultImageCompressOptions(), ...options };

  try {
    const decoded = await decodeImage(file);
    try {
      let { width, height } = scaledSize(decoded.width, decoded.height, maxEdge);
      let canvas = drawToCanvas(decoded.source, width, height);
      if (!canvas) return file;

      let blob = await jpegUnderTarget(
        canvas,
        targetBytes,
        file.size > targetBytes ? 0.7 : 0.78,
      );
      if (!blob) return file;

      if (blob.size > targetBytes && Math.max(width, height) > 640) {
        ({ width, height } = scaledSize(decoded.width, decoded.height, 640));
        canvas = drawToCanvas(decoded.source, width, height);
        if (canvas) {
          blob = (await jpegUnderTarget(canvas, targetBytes, 0.6)) ?? blob;
        }
      }

      return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    } finally {
      decoded.close();
    }
  } catch {
    return file;
  }
}
