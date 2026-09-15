import { mediaKindFromFile } from "@/lib/mediaUrl.ts";

const MAX_EDGE = 1280;
const TARGET_IMAGE_BYTES = 450_000;
const MIN_QUALITY = 0.52;

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
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function scaledSize(width: number, height: number, maxEdge = MAX_EDGE) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function jpegUnderTarget(canvas: HTMLCanvasElement, startQuality = 0.74) {
  let quality = startQuality;
  let blob = await canvasToJpeg(canvas, quality);
  while (blob && blob.size > TARGET_IMAGE_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - 0.08);
    blob = await canvasToJpeg(canvas, quality);
  }
  return blob;
}

export async function snapshotVideoFrame(video: HTMLVideoElement, filename: string): Promise<File> {
  const { width, height } = scaledSize(video.videoWidth, video.videoHeight);
  const canvas = drawToCanvas(video, width, height);
  if (!canvas) throw new Error("Could not capture photo");
  const blob = await jpegUnderTarget(canvas);
  if (!blob) throw new Error("Could not capture photo");
  return new File([blob], filename, { type: "image/jpeg", lastModified: Date.now() });
}

export async function compressImageForUpload(file: File): Promise<File> {
  const kind = mediaKindFromFile(file);
  if (kind === "video" || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }
  if (kind !== "image" && file.type) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = scaledSize(bitmap.width, bitmap.height);
    const canvas = drawToCanvas(bitmap, width, height);
    bitmap.close();
    if (!canvas) return file;

    const blob = await jpegUnderTarget(canvas, file.size > TARGET_IMAGE_BYTES ? 0.72 : 0.78);
    if (!blob) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
