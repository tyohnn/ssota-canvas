/**
 * UUID 생성 유틸리티 함수들
 */

/**
 * 브라우저 호환성을 고려한 UUID v4 생성 함수
 * - 최신 브라우저: crypto.randomUUID() 사용
 * - 구형 브라우저: Date.now() + Math.random() 기반 fallback
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 임시 ID 생성 (optimistic updates용)
 * @param prefix 임시 ID 접두사
 * @returns 임시 ID 문자열
 */
export function generateTempId(prefix = "temp"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * 타임스탬프 기반 ID 생성
 * @param prefix ID 접두사
 * @returns 타임스탬프 기반 ID
 */
export function generateTimestampId(prefix = "id"): string {
  return `${prefix}-${Date.now()}`;
}
