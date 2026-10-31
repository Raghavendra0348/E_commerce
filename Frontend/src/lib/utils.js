import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format price in Indian Rupee format (e.g. ₹1,299)
 */
export function formatPrice(amount) {
  if (amount == null || isNaN(amount)) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}
