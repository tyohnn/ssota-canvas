const SLUG_RE = /^[a-z0-9가-힣-]+$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}
