/**
 * Image Asset Commands
 *
 * Technical Specification 참조: 04-technical-specification.md
 * 비즈니스 의도를 명확히 표현하는 Command 패턴
 */

/**
 * 이미지 자산 생성 Command
 *
 * Process Model: Scenario 1 - AI 이미지 생성 후 저장
 */
export interface CreateImageAssetCommand {
  assetType: 'ai-generated' | 'unsplash' | 'user-upload';
  imageUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
  prompt?: string;
  negativePrompt?: string;
  metadata?: Record<string, any>;
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  createdBy: string;
  workspaceId: string;
}

/**
 * 메타데이터 업데이트 Command
 *
 * Process Model: Scenario 6 - 메타데이터 편집
 */
export interface UpdateImageMetadataCommand {
  imageAssetId: string;
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
}

/**
 * 공개 설정 변경 Command
 *
 * Process Model: Scenario 7 - Public 전환
 */
export interface ChangeImageVisibilityCommand {
  imageAssetId: string;
  isPublic: boolean;
  // Public 전환 시 title/category를 함께 업데이트할 수 있음
  title?: string;
  category?: string;
}

/**
 * 이미지 업로드 Command
 *
 * 이미지 파일 업로드 및 저장을 위한 Command
 * - Storage 업로드 → DB 저장 → Signed URL 생성의 전체 플로우
 *
 * Process Model: 이미지 업로드 플로우
 */
export interface UploadImageCommand {
  /** 에셋 타입 */
  assetType: 'ai-generated' | 'user-upload';

  /** 업로드할 파일 (Buffer 또는 Blob) */
  file: Buffer | Blob;

  /** 파일명 */
  fileName: string;

  /** 파일 크기 (bytes) */
  fileSize: number;

  /** MIME 타입 */
  mimeType: string;

  /** 워크스페이스 ID */
  workspaceId: string;

  /** 생성자 사용자 ID */
  userId: string;

  /** 이미지 너비 (optional) */
  width?: number;

  /** 이미지 높이 (optional) */
  height?: number;

  /** AI 생성 이미지 전용 필드 */
  prompt?: string;
  negativePrompt?: string;
  metadata?: Record<string, any>;
}
