/**
 * ImageAsset Repository Interface
 *
 * Technical Specification 참조: 04-technical-specification.md
 * Domain Layer에서 사용할 Repository 인터페이스 정의
 *
 * DDD 원칙: Infrastructure 레이어(Drizzle)에 의존하지 않음
 */

import type {
  ImageAsset,
  NewImageAsset,
} from '@/db/schemas/image-app-space-schema';
import { ImageAssetEntity } from '../../../shared/entities/image-asset.entity';

/**
 * Community Feed 조회를 위한 파라미터
 */
export interface FindPublicImagesParams {
  sort: 'trending' | 'recent' | 'views';
  category?: string;
  page: number;
  perPage: number;
  currentUserId?: string; // isLiked, isBookmarked 확인용
}

/**
 * Following Feed 조회를 위한 파라미터
 */
export interface FindFollowingImagesParams {
  userId: string;
  page: number;
  perPage: number;
}

/**
 * Workspace 이미지 조회 파라미터
 *
 * 워크스페이스 협업: 멤버 전체의 이미지 조회
 */
export interface FindWorkspaceImagesParams {
  workspaceId: string;
  filterType: 'all' | 'ai-generated' | 'unsplash' | 'user-upload';
  page: number;
  perPage: number;
}

/**
 * Creator Profile (JOIN 결과)
 */
export interface CreatorProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/**
 * ImageAsset with Creator (JOIN 결과)
 */
export interface ImageAssetWithCreator extends ImageAsset {
  creatorProfile?: CreatorProfile;
}

/**
 * ImageAsset with Stats (사용자별 좋아요/북마크 상태 포함)
 */
export interface ImageAssetWithStats extends ImageAssetWithCreator {
  isLiked: boolean;
  isBookmarked: boolean;
}

/**
 * 메타데이터 업데이트 파라미터
 */
export interface UpdateMetadataParams {
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
}

/**
 * ImageAsset Repository Interface
 *
 * 이미지 자산 데이터 액세스 계약
 */
export interface IImageAssetRepository {
  /**
   * 이미지 생성
   */
  create(data: NewImageAsset): Promise<ImageAsset>;

  /**
   * ID로 조회
   */
  findById(id: string): Promise<ImageAsset | null>;

  /**
   * ID로 조회 (Creator Profile 포함)
   */
  findByIdWithCreator(id: string): Promise<ImageAssetWithCreator | null>;

  /**
   * ID로 조회 (Stats 포함)
   */
  findByIdWithStats(
    id: string,
    currentUserId: string
  ): Promise<ImageAssetWithStats | null>;

  /**
   * Public 이미지 조회 (Community Feed)
   *
   * Process Model: Scenario 3 - Community Feed
   */
  findPublicImages(
    params: FindPublicImagesParams
  ): Promise<ImageAssetWithStats[]>;

  /**
   * Following 사용자 이미지 조회 (Following Feed)
   *
   * Process Model: Scenario 5 - Following Feed
   */
  findFollowingUserImages(
    params: FindFollowingImagesParams
  ): Promise<ImageAssetWithStats[]>;

  /**
   * Workspace 이미지 조회 (협업용)
   *
   * 워크스페이스의 모든 멤버가 업로드한 이미지 조회
   * created_by 체크하지 않음 (팀 협업)
   *
   * @param params - 조회 파라미터
   * @returns ImageAsset 배열
   */
  findWorkspaceImages(params: FindWorkspaceImagesParams): Promise<ImageAsset[]>;

  /**
   * 메타데이터 업데이트
   *
   * Process Model: Scenario 6 - 메타데이터 편집
   */
  updateMetadata(id: string, data: UpdateMetadataParams): Promise<ImageAsset>;

  /**
   * 공개 설정 변경
   *
   * Process Model: Scenario 7 - Public 전환
   */
  updateVisibility(id: string, isPublic: boolean): Promise<ImageAsset>;

  /**
   * Soft Delete
   */
  softDelete(id: string): Promise<void>;

  /**
   * 복원
   */
  restore(id: string): Promise<void>;

  /**
   * Signed URL 캐시 업데이트
   *
   * @param id - 이미지 자산 ID
   * @param signedUrl - 새로 생성된 signed URL
   * @param expiresAt - 만료 시간
   */
  updateSignedUrl(
    id: string,
    signedUrl: string,
    expiresAt: Date
  ): Promise<void>;

  /**
   * Unsplash photoId로 조회
   */
  findByUnsplashPhotoId(photoId: string): Promise<ImageAsset | null>;

  /**
   * use_count 증가
   */
  incrementUseCount(id: string): Promise<void>;
}
