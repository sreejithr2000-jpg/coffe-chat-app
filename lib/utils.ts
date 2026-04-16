import { type ClassValue, clsx } from "clsx";

/**
 * Merges Tailwind class names safely.
 * Lightweight alternative to clsx + twMerge for this project's scale.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
