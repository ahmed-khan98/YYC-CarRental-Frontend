import { compressImageForUpload } from "@/lib/compressImage.ts";
import { apiClient } from "./client.ts";

const CHUNK_SIZE = 400 * 1024;

export type FileUploadProgress = {
  fileIndex: number;
  fileCount: number;
  percent: number;
};

async function sleep(ms: number) {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function withRetry<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) throw error;
      await sleep(400 * (attempt + 1));
    }
  }
  throw lastError;
}

async function uploadDirect(file: File, folder?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) formData.append("folder", folder);
  const res = await apiClient.post<{ url: string }>("/upload", formData);
  return res.data.url;
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
    await withRetry(() =>
      apiClient.put(`/upload/sessions/${uploadId}/chunks/${index}`, chunk, {
        headers: { "Content-Type": "application/octet-stream" },
        transformRequest: [(data) => data],
        timeout: 120_000,
      }),
    );
    onChunk?.(Math.round(((index + 1) / totalChunks) * 100));
  }

  const completed = await apiClient.post<{ url: string }>(`/upload/sessions/${uploadId}/complete`);
  return completed.data.url;
}

export async function uploadFile(
  file: File,
  folder?: string,
  onProgress?: (progress: FileUploadProgress) => void,
): Promise<string> {
  const prepared = file.type.startsWith("image/") ? await compressImageForUpload(file) : file;
  const report = (percent: number) => onProgress?.({ fileIndex: 1, fileCount: 1, percent });

  if (prepared.size <= CHUNK_SIZE) {
    try {
      const url = await uploadDirect(prepared, folder);
      report(100);
      return url;
    } catch {
      // Phone photos can still be rejected by a small proxy limit — send in pieces.
    }
  }

  return uploadChunked(prepared, folder, report);
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
