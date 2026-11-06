import type { User } from "@/types/index.ts";

export function customerLabel(customer: User) {
  return `${customer.name ?? "Unknown"} — ${customer.email ?? "No email"}`;
}

export function customerSearchValue(customer: User) {
  const phone = customer.phone ?? "";
  const phoneDigits = phone.replace(/\D/g, "");
  return [customer.name, customer.email, phone, phoneDigits].filter(Boolean).join(" ");
}

export function formatCustomerLabel(customer?: Pick<User, "name" | "email"> | null) {
  if (!customer) return "—";
  return customer.email
    ? `${customer.name ?? "Unknown"} — ${customer.email}`
    : (customer.name ?? "Unknown");
}
