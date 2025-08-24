export const SLUG_RE = /^[a-z0-9가-힣-]+$/;

/**
 * Creates a URL-friendly slug from a string
 * @param input - The input string to convert to a slug
 * @param maxLength - Maximum length of the slug (default: 60)
 * @returns A URL-friendly slug string
 */
export function createSlug(input: string, maxLength = 60): string {
  return (
    (input || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\-\s]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, maxLength) || `field_${Date.now()}`
  );
}
