// apps/web/src/utils/cookie-helpers.ts

/**
 * 쿠키 기반 영속성을 위한 범용 유틸리티 함수들
 * 도메인에 독립적인 일반 쿠키 조작 함수만 포함
 */

/**
 * 쿠키 값 조회
 * @param name - 쿠키 이름
 * @returns 쿠키 값 또는 null
 */
export function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const cookie = cookies.find(c => c.trim().startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] || null : null;
}

/**
 * 쿠키 값 설정
 * @param name - 쿠키 이름
 * @param value - 쿠키 값
 * @param maxAge - 만료 시간 (초 단위, 기본값: 86400 = 1일)
 */
export function setCookieValue(
  name: string,
  value: string,
  maxAge: number = 86400
): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`;
}

/**
 * 쿠키 삭제
 * @param name - 쿠키 이름
 */
export function removeCookieValue(name: string): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=; path=/; max-age=0`;
}
