/**
 * Path Generator
 *
 * Supabase Storage path 생성 로직
 */

/**
 * Storage 경로 생성
 *
 * 워크스페이스 중심 구조: {workspaceId}/{YYYYMMDD}/{uuid}.{ext}
 *
 * @param workspaceId - 워크스페이스 ID
 * @param fileName - 파일명
 * @returns Storage 경로
 */
export function generateAssetPath(
  workspaceId: string,
  fileName: string
): string {
  // YYYYMMDD 형식 날짜
  const date = new Date().toISOString().split('T')[0]!.replace(/-/g, '');

  // UUID
  const uuid = crypto.randomUUID();

  // 확장자
  const ext = getFileExtension(fileName) || 'png';

  return `${workspaceId}/${date}/${uuid}.${ext}`;
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()! : '';
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 100);
}
