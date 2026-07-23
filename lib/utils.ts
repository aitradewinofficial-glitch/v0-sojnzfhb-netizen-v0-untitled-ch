import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a product title into a URL-friendly slug.
 * e.g. "HS # 12" -> "hs-12", "Swivel Hooked Snap" -> "swivel-hooked-snap"
 * Keeps unicode letters/numbers (incl. Cyrillic) and collapses everything else into dashes.
 * The normalization here MUST stay in sync with the SQL used in getProductById.
 */
export function slugify(input: string | null | undefined): string {
  if (!input) return ""
  return String(input)
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Builds a product page URL from its title, falling back to the id when the
 * title produces an empty slug (e.g. a title made only of symbols).
 */
export function productHref(title: string | null | undefined, id: string, isEnglish = false): string {
  const slug = slugify(title) || id
  return isEnglish ? `/en/product/${slug}` : `/product/${slug}`
}
