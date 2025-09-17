/**
 * 🔹 Frontend (React) - Utility Functions
 * MERN Concepts Used:
 * ✅ Components - Utility functions for component styling
 * ✅ Props - CSS class merging for dynamic component props
 * ✅ Styling (CSS / Tailwind / Bootstrap) - Tailwind CSS class utility functions
 */

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}