import { apiClient } from "./client.ts";

export type ContactPayload = {
  fullName: string;
  email: string;
  phone: string;
  message: string;
};

export const contactApi = {
  submit: async (data: ContactPayload) => {
    const res = await apiClient.post<{ success: boolean; message: string }>("/contact", data);
    if (!res.data?.success) {
      throw new Error(res.data?.message || "Unable to send your message.");
    }
    return res.data;
  },
};
