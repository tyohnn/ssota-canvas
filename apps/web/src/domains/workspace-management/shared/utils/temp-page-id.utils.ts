/**
 * 임시 페이지 ID 관련 유틸리티 함수
 */

/**
 * 임시 페이지 ID 생성 (UUID v4 형식 호환)
 *
 * 첫 번째 세그먼트를 "00000000"으로 설정하여 임시 ID임을 표시
 * UUID v4 형식: xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx
 * 임시 ID 형식: 00000000-xxxx-4xxx-xxxx-xxxxxxxxxxxx
 */
export async function generateTempPageId(): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.randomUUID) {
    // Node.js 환경에서는 crypto 모듈 사용 (dynamic import)
    const { randomUUID } = await import('crypto');
    const uuid = randomUUID();
    return `00000000-${uuid.slice(9)}`;
  }

  // 브라우저 환경
  const uuid = crypto.randomUUID();
  return `00000000-${uuid.slice(9)}`;
}

/**
 * 임시 페이지 ID인지 확인
 *
 * @param pageId - 확인할 페이지 ID
 * @returns 임시 ID이면 true, 아니면 false
 */
export function isTempPageId(pageId: string): boolean {
  if (!pageId) return false;
  // 첫 번째 세그먼트가 "00000000"으로 시작하는지 확인
  return pageId.startsWith('00000000-');
}
