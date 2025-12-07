/**
 * Image Asset Zod Schemas
 *
 * Technical Specification 참조: 04-technical-specification.md
 * Trust Boundary 검증을 위한 Zod 스키마 정의
 */

import { z } from 'zod';
import {
  imageAssetTypeEnum,
  imageCategoryEnum,
} from '@/db/schemas/image-app-space-schema';

/**
 * Asset Type 검증 스키마
 */
export const AssetTypeSchema = z.enum(
  imageAssetTypeEnum.enumValues as [string, ...string[]]
);

/**
 * Category 검증 스키마
 */
export const CategorySchema = z.enum(
  imageCategoryEnum.enumValues as [string, ...string[]]
);

/**
 * 이미지 자산 생성 요청 스키마
 *
 * Process Model: Scenario 1 - AI 이미지 생성 후 저장
 */
export const CreateImageAssetRequestSchema = z.object({
  assetType: AssetTypeSchema,
  imageUrl: z.string().min(1, { message: 'Invalid image URL' }),
  thumbnailUrl: z
    .string()
    .min(1, { message: 'Invalid thumbnail URL' })
    .optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  prompt: z.string().optional(),
  negativePrompt: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z
    .array(z.string())
    .max(10, { message: 'Maximum 10 tags allowed' })
    .optional(),
  category: CategorySchema.optional(),
  workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
});

export type CreateImageAssetRequest = z.infer<
  typeof CreateImageAssetRequestSchema
>;

/**
 * 커뮤니티 피드 조회 요청 스키마
 *
 * Process Model: Scenario 3 - Community Feed
 */
export const BrowseCommunityFeedRequestSchema = z.object({
  sort: z.enum(['trending', 'recent', 'views']).default('trending'),
  category: CategorySchema.optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(50).default(20),
});

export type BrowseCommunityFeedRequest = z.infer<
  typeof BrowseCommunityFeedRequestSchema
>;

/**
 * 팔로잉 피드 조회 요청 스키마
 *
 * Process Model: Scenario 5 - Following Feed
 */
export const BrowseFollowingFeedRequestSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(50).default(20),
});

export type BrowseFollowingFeedRequest = z.infer<
  typeof BrowseFollowingFeedRequestSchema
>;

/**
 * 이미지 좋아요 요청 스키마
 *
 * Process Model: Scenario 3 - Community Feed 상호작용
 */
export const LikeImageRequestSchema = z.object({
  imageAssetId: z.string().uuid({ message: 'Invalid image asset ID' }),
});

export type LikeImageRequest = z.infer<typeof LikeImageRequestSchema>;

/**
 * 이미지 북마크 요청 스키마
 *
 * Process Model: Scenario 2 - Unsplash 이미지 북마크
 */
export const BookmarkImageRequestSchema = z.object({
  imageAssetId: z.string().uuid({ message: 'Invalid image asset ID' }),
});

export type BookmarkImageRequest = z.infer<typeof BookmarkImageRequestSchema>;

/**
 * 사용자 팔로우 요청 스키마
 *
 * Process Model: Scenario 3 - 크리에이터 팔로우
 */
export const FollowUserRequestSchema = z.object({
  followeeId: z.string().uuid({ message: 'Invalid user ID' }),
});

export type FollowUserRequest = z.infer<typeof FollowUserRequestSchema>;

/**
 * 메타데이터 업데이트 요청 스키마
 *
 * Process Model: Scenario 6 - 메타데이터 편집
 */
export const UpdateImageMetadataRequestSchema = z.object({
  imageAssetId: z.string().uuid({ message: 'Invalid image asset ID' }),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z
    .array(z.string())
    .max(10, { message: 'Maximum 10 tags allowed' })
    .optional(),
  category: CategorySchema.optional(),
});

export type UpdateImageMetadataRequest = z.infer<
  typeof UpdateImageMetadataRequestSchema
>;

/**
 * 공개 설정 변경 요청 스키마
 *
 * Process Model: Scenario 7 - Public 전환
 */
export const ChangeImageVisibilityRequestSchema = z.object({
  imageAssetId: z.string().uuid({ message: 'Invalid image asset ID' }),
  isPublic: z.boolean(),
  // Public 전환 시 title/category를 함께 업데이트할 수 있음
  title: z.string().optional(),
  category: CategorySchema.optional(),
});

export type ChangeImageVisibilityRequest = z.infer<
  typeof ChangeImageVisibilityRequestSchema
>;

/**
 * Workspace 이미지 조회 요청 스키마
 *
 * 워크스페이스의 모든 멤버가 업로드한 이미지 조회
 */
export const GetWorkspaceImagesRequestSchema = z.object({
  workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  filterType: z
    .enum(['all', 'ai-generated', 'unsplash', 'user-upload'])
    .default('all'),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(20),
});

export type GetWorkspaceImagesRequest = z.infer<
  typeof GetWorkspaceImagesRequestSchema
>;

/**
 * 이미지 URL 조회 요청 스키마
 *
 * Signed URL 생성을 위한 요청
 */
export const GetImageUrlRequestSchema = z.object({
  imageAssetId: z.string().uuid({ message: 'Invalid image asset ID' }),
});

export type GetImageUrlRequest = z.infer<typeof GetImageUrlRequestSchema>;

/**
 * Unsplash 이미지 저장/조회 요청 스키마
 *
 * photoId로 중복 체크 후 생성 또는 기존 것 반환
 */
export const CreateOrGetUnsplashImageAssetRequestSchema = z.object({
  photoId: z.string().min(1, { message: 'Invalid Unsplash photo ID' }),
  imageUrl: z.string().url({ message: 'Invalid image URL' }),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  authorName: z.string().min(1, { message: 'Author name required' }),
  authorUsername: z.string().min(1, { message: 'Author username required' }),
  authorLink: z.string().url({ message: 'Invalid author link' }),
  altDescription: z.string().optional(),
  workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
});

export type CreateOrGetUnsplashImageAssetRequest = z.infer<
  typeof CreateOrGetUnsplashImageAssetRequestSchema
>;
