/**
 * UUID 검증 및 포맷팅 유틸리티 함수들
 */

// UUID v4 형식 검증 정규식
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * UUID v4 형식이 유효한지 검증
 */
export function isValidUUID(uuid: string): boolean {
  return UUID_V4_REGEX.test(uuid);
}

/**
 * UUID 형식 검증 및 사용자 친화적인 에러 메시지 생성
 */
export function validateUUID(uuid: string): {
  isValid: boolean;
  error?: string;
} {
  if (!uuid) {
    return { isValid: false, error: "Project ID is required" };
  }

  if (!isValidUUID(uuid)) {
    return {
      isValid: false,
      error:
        "Invalid project ID format. Expected format: xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx",
    };
  }

  return { isValid: true };
}

/**
 * UUID 형식을 사용자 친화적으로 표시
 */
export function formatUUID(uuid: string): string {
  if (!uuid) return "";

  // 이미 올바른 형식이면 그대로 반환
  if (isValidUUID(uuid)) {
    return uuid;
  }

  // 부분적으로 포맷팅 시도
  const cleaned = uuid.replace(/[^0-9a-f]/gi, "");
  if (cleaned.length === 32) {
    return `${cleaned.slice(0, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12, 16)}-${cleaned.slice(16, 20)}-${cleaned.slice(20)}`;
  }

  return uuid;
}

/**
 * UUID 검증 에러 메시지를 사용자 친화적으로 변환
 */
export function getUUIDErrorMessage(uuid: string): string {
  const validation = validateUUID(uuid);

  if (validation.isValid) {
    return "";
  }

  return validation.error || "Invalid project ID format";
}
