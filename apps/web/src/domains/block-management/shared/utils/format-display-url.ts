/**
 * Long URLs (e.g. Supabase storage signed URLs)을 UI에 간략하게 표시하기 위한 유틸.
 * 링크 href는 원본 URL 유지, 표시 텍스트만 짧게 만듦.
 */

const SUPABASE_STORAGE_SIGN_PATH = '/storage/v1/object/sign/';
const DEFAULT_MAX_LENGTH = 56;

/**
 * Supabase storage signed URL 여부 확인
 */
function isSupabaseSignedUrl(url: string): boolean {
  try {
    return (
      url.includes('supabase.co') && url.includes(SUPABASE_STORAGE_SIGN_PATH)
    );
  } catch {
    return false;
  }
}

/**
 * URL에서 path 부분만 추출 (origin 제외, query 제거)
 * e.g. https://xxx.supabase.co/storage/v1/object/sign/bucket/path?token=... → /storage/v1/object/sign/bucket/path
 */
function getPathWithoutQuery(url: string): string | null {
  try {
    const u = new URL(url);
    return u.pathname;
  } catch {
    return null;
  }
}

/**
 * path에서 버킷/파일 부분만 짧게 (마지막 세그먼트 또는 'bucket/.../file.ext')
 */
function shortPath(path: string, maxSegments = 2): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length <= maxSegments) return path;
  const last = segments.slice(-maxSegments).join('/');
  return `…/${last}`;
}

/**
 * UI에 표시할 짧은 URL 문자열 반환.
 * - Supabase storage signed URL: path 기준 짧게 (예: …/bucket/filename.mp3)
 * - 그 외 긴 URL: 앞부분 + … 로 자르기
 */
export function formatShortDisplayUrl(
  url: string,
  maxLength: number = DEFAULT_MAX_LENGTH
): string {
  if (!url || typeof url !== 'string') return url;

  const trimmed = url.trim();
  if (trimmed.length <= maxLength) return trimmed;

  if (isSupabaseSignedUrl(trimmed)) {
    const path = getPathWithoutQuery(trimmed);
    if (path) {
      const short = shortPath(path);
      return short.length > maxLength
        ? short.slice(0, maxLength - 1) + '…'
        : short;
    }
  }

  return trimmed.slice(0, maxLength - 1) + '…';
}
