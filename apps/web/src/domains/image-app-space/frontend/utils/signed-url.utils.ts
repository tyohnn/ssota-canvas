/**
 * Signed URL Utilities
 *
 * Signed URL 만료 확인 및 재생성 로직
 */

/**
 * JWT 토큰에서 exp 클레임 추출 (base64 디코딩)
 */
function getExpFromJwtToken(token: string): number | null {
  try {
    // JWT는 header.payload.signature 형식
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // payload 부분 디코딩 (base64url → base64 → JSON)
    const payload = parts[1];
    if (!payload) {
      return null;
    }

    // base64url to base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // 패딩 추가
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    // 브라우저/Node.js 호환 디코딩
    let decoded: string;
    if (typeof atob === 'function') {
      decoded = atob(padded);
    } else {
      // Node.js 환경
      decoded = Buffer.from(padded, 'base64').toString('utf-8');
    }

    const json = JSON.parse(decoded);
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
}

/**
 * Signed URL에서 만료 시간 추출
 *
 * Supabase signed URL 형식:
 * ?token=eyJhbGci... (JWT 토큰, payload에 exp 클레임 포함)
 */
export function getSignedUrlExpiry(url: string): Date | null {
  try {
    const urlObj = new URL(url);

    // JWT 토큰에서 exp 추출
    const token = urlObj.searchParams.get('token');
    if (token) {
      const exp = getExpFromJwtToken(token);
      if (exp) {
        return new Date(exp * 1000);
      }
    }

    return null;
  } catch (error) {
    console.error('[getSignedUrlExpiry] Invalid URL:', error);
    return null;
  }
}

/**
 * Signed URL 만료 여부 확인
 *
 * @param url - Signed URL
 * @param bufferMinutes - 만료 전 갱신 버퍼 (기본 60분)
 * @returns true if expired or about to expire
 */
export function isSignedUrlExpired(
  url: string | undefined | null,
  bufferMinutes = 60
): boolean {
  if (!url) {
    return true;
  }

  const expiryDate = getSignedUrlExpiry(url);
  if (!expiryDate) {
    // 만료 시간을 파싱할 수 없으면 만료된 것으로 간주
    return true;
  }

  const now = new Date();
  const bufferMs = bufferMinutes * 60 * 1000;
  const expiryWithBuffer = new Date(expiryDate.getTime() - bufferMs);

  // 현재 시간이 (만료 시간 - 버퍼) 이후면 만료된 것으로 간주
  return now >= expiryWithBuffer;
}

/**
 * Storage path인지 Signed URL인지 확인
 */
export function isStoragePath(url: string | undefined | null): boolean {
  if (!url) {
    return false;
  }

  // Signed URL은 token 파라미터를 가짐
  try {
    const urlObj = new URL(url);
    return !urlObj.searchParams.has('token');
  } catch {
    // URL이 아니면 storage path
    return true;
  }
}
