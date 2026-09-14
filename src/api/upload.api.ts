import { apiClient } from "./client.ts";

export async function uploadFile(file: File, folder?: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) formData.append("folder", folder);

  const res = await apiClient.post<{ url: string }>("/upload", formData);
  return res.data.url;
}

export async function uploadFiles(files: File[], folder?: string): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (folder) formData.append("folder", folder);

  const res = await apiClient.post<{ urls: string[] }>("/upload/multiple", formData);
  return res.data.urls;
}
