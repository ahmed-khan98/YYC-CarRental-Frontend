import { EMAIL_ERROR, isValidEmail } from "@/lib/email.ts";

export type ContactFormValues = {
  fullName: string;
  email: string;
  phone: string;
  message: string;
};

export const EMPTY_CONTACT_FORM: ContactFormValues = {
  fullName: "",
  email: "",
  phone: "",
  message: "",
};

export function validateContactForm(form: ContactFormValues):
  | { ok: true; values: ContactFormValues }
  | { ok: false; message: string } {
  const fullName = form.fullName.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();
  const message = form.message.trim();

  if (!fullName || !email || !phone || !message) {
    return { ok: false, message: "Please fill in all required fields." };
  }
  if (!isValidEmail(email)) {
    return { ok: false, message: EMAIL_ERROR };
  }
  return { ok: true, values: { fullName, email, phone, message } };
}
