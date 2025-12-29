import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Contact email from environment variable
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'support@qzvert.com'
