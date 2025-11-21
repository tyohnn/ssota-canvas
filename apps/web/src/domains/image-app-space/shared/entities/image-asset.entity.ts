/**
 * Image Asset Entity
 *
 * Technical Specification 참조: 06-technical-specification.md
 * Domain Model의 핵심 엔티티
 *
 * 비즈니스 규칙:
 * - Public 전환 시 제목과 카테고리 필수
 * - created_by만 편집 가능
 * - 본인 이미지 또는 Public 이미지만 조회 가능
 * - Popularity Score = view_count + like_count * 2 + bookmark_count * 3
 */

import type {
  ImageAsset,
  ImageAssetType,
  ImageCategory,
} from '@/db/schemas/image-app-space-schema';

export class ImageAssetEntity {
  readonly id: string;
  readonly assetType: ImageAssetType;
  readonly imageUrl: string;
  readonly thumbnailUrl?: string;
  readonly width?: number;
  readonly height?: number;
  readonly fileSize?: number;
  readonly mimeType?: string;
  readonly prompt?: string;
  readonly negativePrompt?: string;
  readonly metadata: Record<string, any>;
  readonly title?: string;
  readonly description?: string;
  readonly tags: string[];
  readonly category?: ImageCategory;
  readonly createdBy: string;
  readonly workspaceId: string;
  readonly isPublic: boolean;
  readonly isDeleted: boolean;
  readonly viewCount: number;
  readonly bookmarkCount: number;
  readonly likeCount: number;
  readonly useCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt?: Date;

  private constructor(data: ImageAsset) {
    this.id = data.id;
    this.assetType = data.asset_type;
    this.imageUrl = data.image_url;
    this.thumbnailUrl = data.thumbnail_url ?? undefined;
    this.width = data.width ?? undefined;
    this.height = data.height ?? undefined;
    this.fileSize = data.file_size ?? undefined;
    this.mimeType = data.mime_type ?? undefined;
    this.prompt = data.prompt ?? undefined;
    this.negativePrompt = data.negative_prompt ?? undefined;
    this.metadata = (data.metadata as Record<string, any>) ?? {};
    this.title = data.title ?? undefined;
    this.description = data.description ?? undefined;
    this.tags = data.tags ?? [];
    this.category = data.category ?? undefined;
    this.createdBy = data.created_by;
    this.workspaceId = data.workspace_id;
    this.isPublic = data.is_public;
    this.isDeleted = data.is_deleted;
    this.viewCount = data.view_count;
    this.bookmarkCount = data.bookmark_count;
    this.likeCount = data.like_count;
    this.useCount = data.use_count;
    this.createdAt = new Date(data.created_at);
    this.updatedAt = new Date(data.updated_at);
    this.deletedAt = data.deleted_at ? new Date(data.deleted_at) : undefined;
  }

  /**
   * Factory Method: Database 레코드로부터 Entity 생성
   */
  static fromDatabase(data: ImageAsset): ImageAssetEntity {
    return new ImageAssetEntity(data);
  }

  /**
   * Business Rule: Public으로 설정하려면 제목과 카테고리 필수
   *
   * Process Model: Scenario 7 - Public 전환 검증
   */
  canSetPublic(): { valid: boolean; reason?: string } {
    if (!this.title) {
      return { valid: false, reason: 'Title is required for public images' };
    }
    if (!this.category) {
      return { valid: false, reason: 'Category is required for public images' };
    }
    return { valid: true };
  }

  /**
   * Business Rule: 특정 사용자가 이 이미지를 편집할 수 있는지
   *
   * Process Model: Scenario 6 - 메타데이터 편집 권한
   */
  canEdit(userId: string): boolean {
    return this.createdBy === userId;
  }

  /**
   * Business Rule: 특정 사용자가 이 이미지를 볼 수 있는지
   *
   * RLS Policy와 동일한 로직 (Application Level 검증)
   */
  canView(userId: string): boolean {
    // 삭제된 이미지는 아무도 볼 수 없음
    if (this.isDeleted) {
      return false;
    }
    // 본인이 생성한 이미지는 볼 수 있음
    if (this.createdBy === userId) {
      return true;
    }
    // Public 이미지는 볼 수 있음
    return this.isPublic;
  }

  /**
   * Popularity Score 계산
   *
   * Process Model: Scenario 3 - Community Feed 인기순 정렬
   * Formula: view_count + like_count * 2 + bookmark_count * 3
   */
  getPopularityScore(): number {
    return this.viewCount + this.likeCount * 2 + this.bookmarkCount * 3;
  }

  /**
   * DTO 변환 (Frontend로 전달)
   */
  toJSON(): ImageAsset {
    return {
      id: this.id,
      asset_type: this.assetType,
      image_url: this.imageUrl,
      thumbnail_url: this.thumbnailUrl ?? null,
      width: this.width ?? null,
      height: this.height ?? null,
      file_size: this.fileSize ?? null,
      mime_type: this.mimeType ?? null,
      prompt: this.prompt ?? null,
      negative_prompt: this.negativePrompt ?? null,
      metadata: this.metadata,
      title: this.title ?? null,
      description: this.description ?? null,
      tags: this.tags,
      category: this.category ?? null,
      created_by: this.createdBy,
      workspace_id: this.workspaceId,
      is_public: this.isPublic,
      is_deleted: this.isDeleted,
      view_count: this.viewCount,
      bookmark_count: this.bookmarkCount,
      like_count: this.likeCount,
      use_count: this.useCount,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt ?? null,
    };
  }
}
