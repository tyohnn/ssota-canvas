/**
 * Signed URL Utilities
 *
 * Signed URL 만료 확인 및 재생성 로직
 */

/**
 * Signed URL에서 만료 시간 추출
 *
 * Supabase signed URL 형식:
 * https://.../path?token=...&exp=1764398810
 */
export function getSignedUrlExpiry(url: string): Date | null {
  try {
    const urlObj = new URL(url);
    const expParam = urlObj.searchParams.get('exp');

    if (!expParam) {
      return null;
    }

    const expTimestamp = parseInt(expParam, 10);
    if (isNaN(expTimestamp)) {
      return null;
    }

    return new Date(expTimestamp * 1000); // Unix timestamp to Date
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
