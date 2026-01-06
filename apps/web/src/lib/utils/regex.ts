export const SLUG_RE = /^[a-z0-9가-힣-]+$/;

/**
 * Creates a URL-friendly slug from a string
 * @param input - The input string to convert to a slug
 * @param maxLength - Maximum length of the slug (default: 60)
 * @returns A URL-friendly slug string
 */
export function createSlug(input: string, maxLength = 60): string {
  return (
    (input || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\-\s]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, maxLength) || `field_${Date.now()}`
  );
}

/**
 * Creates a random slug with uppercase, lowercase, and numbers
 * @param length - Length of the slug (default: 5)
 * @returns A random slug string
 */
export function createRandomSlug(length = 5): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Creates a short random ID with lowercase letters and numbers (8 characters by default)
 * @param length - Length of the ID (default: 8)
 * @returns A short random ID string
 */
export function createShortId(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Creates a unique field ID that doesn't exist in the current formSchema
 * @param label - The field label to base the ID on
 * @param existingFields - Array of existing field IDs to check against
 * @returns A unique field ID
 */
export function createUniqueFieldId(
  label: string,
  existingFields: string[]
): string {
  // 먼저 label에서 기본 slug 생성 시도
  let baseId = createRandomSlug();

  // 기존 필드와 중복되지 않는지 확인
  if (!existingFields.includes(baseId)) {
    return baseId;
  }

  // 중복되는 경우 랜덤 슬러그를 추가하여 고유성 보장
  let attempts = 0;
  const maxAttempts = 100; // 무한 루프 방지

  while (attempts < maxAttempts) {
    const randomSuffix = createRandomSlug();
    const uniqueId = `${baseId}_${randomSuffix}`;

    if (!existingFields.includes(uniqueId)) {
      return uniqueId;
    }

    attempts++;
  }

  // 최후의 수단으로 타임스탬프 기반 ID 생성
  return `field_${Date.now()}_${createRandomSlug()}`;
}
