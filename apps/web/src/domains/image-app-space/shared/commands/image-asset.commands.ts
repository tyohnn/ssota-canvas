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
