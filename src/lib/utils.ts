import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Contact emails from environment variables
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'support@qzvert.com'
export const PRIVACY_EMAIL = import.meta.env.VITE_PRIVACY_EMAIL || 'privacy@qzvert.com'
