import axios from "axios";
import { compressImageForUpload } from "@/lib/compressImage.ts";
import { mediaKindFromFile, resolveMediaUrl } from "@/lib/mediaUrl.ts";
import { isMobileBrowser } from "@/lib/openPdf.ts";
import { apiClient } from "./client.ts";

const CHUNK_SIZE = 256 * 1024;
const PROXY_SAFE_BYTES = 900 * 1024;
let preferredChunkMethod: "post" | "put" | null = null;

export type FileUploadProgress = {
  fileIndex: number;
  fileCount: number;
  percent: number;
};

async function sleep(ms: number) {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function withRetry<T>(run: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) throw error;
      await sleep(500 * (attempt + 1));
    }
  }
  throw lastError;
}

function publicUploadUrl(url?: string | null) {
  const resolved = resolveMediaUrl(url);
  if (!resolved) {
    throw new Error("Upload succeeded but no file URL was returned");
  }
  return resolved;
}

function isMissingRoute(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  const message = String((error.response?.data as { message?: string } | undefined)?.message ?? "");
  return status === 404 || status === 405 || /route not found/i.test(message);
}

async function uploadDirect(file: File, folder?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) formData.append("folder", folder);
  const res = await apiClient.post<{ url: string }>("/upload", formData);
  return publicUploadUrl(res.data.url);
}

async function sendChunkPut(uploadId: string, index: number, chunk: Blob) {
  await apiClient.put(`/upload/sessions/${uploadId}/chunks/${index}`, chunk, {
    headers: { "Content-Type": "application/octet-stream" },
    transformRequest: [(data) => data],
    timeout: 120_000,
  });
}

async function sendChunkPost(uploadId: string, index: number, chunk: Blob) {
  const formData = new FormData();
  formData.append("chunk", chunk, `chunk-${index}.part`);
  await apiClient.post(`/upload/sessions/${uploadId}/chunks/${index}`, formData, {
    timeout: 120_000,
  });
}

async function sendChunk(uploadId: string, index: number, chunk: Blob) {
  if (preferredChunkMethod === "put") {
    await sendChunkPut(uploadId, index, chunk);
    return;
  }

  try {
    await sendChunkPost(uploadId, index, chunk);
    preferredChunkMethod = "post";
    return;
  } catch (error) {
    if (preferredChunkMethod === "post" || !isMissingRoute(error)) throw error;
  }

  await sendChunkPut(uploadId, index, chunk);
  preferredChunkMethod = "put";
}

async function uploadChunked(
  file: File,
  folder?: string,
  onChunk?: (percent: number) => void,
) {
  const started = await apiClient.post<{ uploadId: string; chunkSize: number; totalChunks: number }>(
    "/upload/sessions",
    {
      filename: file.name || "upload",
      mimeType: file.type || "application/octet-stream",
      folder,
      totalSize: file.size,
      chunkSize: CHUNK_SIZE,
    },
  );
  const { uploadId, chunkSize, totalChunks } = started.data;

  for (let index = 0; index < totalChunks; index += 1) {
    const start = index * chunkSize;
    const chunk = file.slice(start, Math.min(file.size, start + chunkSize));
    await withRetry(() => sendChunk(uploadId, index, chunk));
    onChunk?.(Math.round(((index + 1) / totalChunks) * 100));
  }

  const completed = await apiClient.post<{ url: string }>(`/upload/sessions/${uploadId}/complete`);
  return publicUploadUrl(completed.data.url);
}

async function prepareImage(file: File) {
  let prepared = await compressImageForUpload(file);
  if (prepared.size > PROXY_SAFE_BYTES) {
    prepared = await compressImageForUpload(file, { maxEdge: 720, targetBytes: 120_000 });
  }
  if (prepared.size > PROXY_SAFE_BYTES) {
    prepared = await compressImageForUpload(prepared, { maxEdge: 640, targetBytes: 90_000 });
  }
  return prepared;
}

async function uploadPrepared(
  prepared: File,
  folder: string | undefined,
  report: (percent: number) => void,
) {
  const preferChunk =
    mediaKindFromFile(prepared) === "video" ||
    isMobileBrowser() ||
    prepared.size > PROXY_SAFE_BYTES;

  if (preferChunk) {
    try {
      const url = await uploadChunked(prepared, folder, report);
      report(100);
      return url;
    } catch (chunkError) {
      if (prepared.size <= PROXY_SAFE_BYTES) {
        const url = await uploadDirect(prepared, folder);
        report(100);
        return url;
      }
      throw chunkError;
    }
  }

  try {
    const url = await uploadDirect(prepared, folder);
    report(100);
    return url;
  } catch (directError) {
    try {
      const url = await uploadChunked(prepared, folder, report);
      report(100);
      return url;
    } catch (chunkError) {
      if (isMissingRoute(chunkError)) throw directError;
      throw chunkError;
    }
  }
}

export async function uploadFile(
  file: File,
  folder?: string,
  onProgress?: (progress: FileUploadProgress) => void,
): Promise<string> {
  const prepared = mediaKindFromFile(file) === "video" ? file : await prepareImage(file);
  const report = (percent: number) => onProgress?.({ fileIndex: 1, fileCount: 1, percent });
  return uploadPrepared(prepared, folder, report);
}

export async function uploadFiles(
  files: File[],
  folder?: string,
  onProgress?: (progress: FileUploadProgress) => void,
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i += 1) {
    urls.push(
      await uploadFile(files[i], folder, (progress) =>
        onProgress?.({
          fileIndex: i + 1,
          fileCount: files.length,
          percent: progress.percent,
        }),
      ),
    );
  }
  return urls;
}
