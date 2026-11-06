export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_ERROR = "Please enter a valid email address.";

export function isValidEmail(value: string | null | undefined): boolean {
  const email = typeof value === "string" ? value.trim() : "";
  return EMAIL_REGEX.test(email) && email.length <= 254;
}
