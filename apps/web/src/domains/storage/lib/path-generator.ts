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

export interface CanvasAssetPathOptions {
  orgId: string;
  workspaceId: string;
  fileName: string;
}

/**
 * canvas-assets 경로 생성
 *
 * 구조: {orgId}/{workspaceId}/{filename}-{uuid}.{ext}
 * - filename: sanitize된 파일명(확장자 제외)
 */
export function generateCanvasAssetPath(options: CanvasAssetPathOptions): string {
  const { orgId, workspaceId, fileName } = options;
  const ext = getFileExtension(fileName) || 'bin';
  const baseName = fileName.slice(0, fileName.length - (ext ? ext.length + 1 : 0)) || 'file';
  const safeName = sanitizeFilename(baseName) || 'file';
  const uuid = crypto.randomUUID();
  return `${orgId}/${workspaceId}/${safeName}-${uuid}.${ext}`;
}
