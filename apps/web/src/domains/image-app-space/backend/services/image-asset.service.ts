/**
 * ImageAsset Service
 *
 * Technical Specification 참조: 04-technical-specification.md
 * 이미지 자산 관련 비즈니스 로직 처리
 */

import { Result } from '@/utils/result';
import type { IImageAssetRepository } from '../repositories/interfaces/image-asset.repository.interface';
import type { IImageAssetService } from './interfaces/image-asset.service.interface';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';
import { ImageAssetEntity } from '../../shared/entities/image-asset.entity';
import type {
  CreateImageAssetCommand,
  UpdateImageMetadataCommand,
  ChangeImageVisibilityCommand,
} from '../../shared/commands/image-asset.commands';

/**
 * Domain Error
 */
export class ImageAssetError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ImageAssetError';
  }
}

/**
 * ImageAsset Service
 *
 * 이미지 자산 비즈니스 로직 처리
 */
export class ImageAssetService implements IImageAssetService {
  constructor(private readonly repository: IImageAssetRepository) {}

  /**
   * 이미지 자산 생성
   *
   * Process Model: Scenario 1 - AI 이미지 생성 후 저장
   */
  async createImageAsset(
    command: CreateImageAssetCommand
  ): Promise<Result<ImageAsset, ImageAssetError>> {
    try {
      // NewImageAsset 데이터 생성
      const newImageAsset = {
        asset_type: command.assetType,
        image_url: command.imageUrl,
        thumbnail_url: command.thumbnailUrl ?? null,
        width: command.width ?? null,
        height: command.height ?? null,
        file_size: command.fileSize ?? null,
        mime_type: command.mimeType ?? null,
        prompt: command.prompt ?? null,
        negative_prompt: command.negativePrompt ?? null,
        metadata: command.metadata ?? {},
        title: command.title ?? null,
        description: command.description ?? null,
        tags: command.tags ?? [],
        category: (command.category as any) ?? null,
        created_by: command.createdBy,
        workspace_id: command.workspaceId,
        is_public: false, // 기본값: Private
        is_deleted: false,
        view_count: 0,
        bookmark_count: 0,
        like_count: 0,
        use_count: 0,
      };

      const imageAsset = await this.repository.create(newImageAsset);

      return Result.success(imageAsset);
    } catch (error) {
      return Result.error(
        new ImageAssetError(
          'CREATE_FAILED',
          error instanceof Error
            ? error.message
            : 'Failed to create image asset'
        )
      );
    }
  }

  /**
   * 메타데이터 업데이트
   *
   * Process Model: Scenario 6 - 메타데이터 편집
   */
  async updateMetadata(
    command: UpdateImageMetadataCommand,
    currentUserId: string
  ): Promise<Result<ImageAsset, ImageAssetError>> {
    try {
      // 1. 기존 ImageAsset 조회
      const existingAsset = await this.repository.findById(
        command.imageAssetId
      );
      if (!existingAsset) {
        return Result.error(
          new ImageAssetError('NOT_FOUND', 'Image asset not found')
        );
      }

      // 2. Entity로 변환하여 권한 검증
      const entity = ImageAssetEntity.fromDatabase(existingAsset);
      if (!entity.canEdit(currentUserId)) {
        return Result.error(
          new ImageAssetError(
            'PERMISSION_DENIED',
            'You do not have permission to edit this image'
          )
        );
      }

      // 3. 태그 개수 검증 (최대 10개)
      if (command.tags && command.tags.length > 10) {
        return Result.error(
          new ImageAssetError('TAG_LIMIT_EXCEEDED', 'Maximum 10 tags allowed')
        );
      }

      // 4. Repository로 업데이트
      const updatedAsset = await this.repository.updateMetadata(
        command.imageAssetId,
        {
          title: command.title,
          description: command.description,
          tags: command.tags,
          category: command.category,
        }
      );

      return Result.success(updatedAsset);
    } catch (error) {
      return Result.error(
        new ImageAssetError(
          'UPDATE_FAILED',
          error instanceof Error ? error.message : 'Failed to update metadata'
        )
      );
    }
  }

  /**
   * 공개 설정 변경
   *
   * Process Model: Scenario 7 - Public 전환
   */
  async changeVisibility(
    command: ChangeImageVisibilityCommand,
    currentUserId: string
  ): Promise<Result<ImageAsset, ImageAssetError>> {
    try {
      // 1. 기존 ImageAsset 조회
      const existingAsset = await this.repository.findById(
        command.imageAssetId
      );
      if (!existingAsset) {
        return Result.error(
          new ImageAssetError('NOT_FOUND', 'Image asset not found')
        );
      }

      // 2. Entity로 변환하여 권한 검증
      const entity = ImageAssetEntity.fromDatabase(existingAsset);
      if (!entity.canEdit(currentUserId)) {
        return Result.error(
          new ImageAssetError(
            'PERMISSION_DENIED',
            'You do not have permission to edit this image'
          )
        );
      }

      // 3. Public 전환 시 필수 필드 검증
      if (command.isPublic) {
        // Command에 title/category가 있으면 먼저 업데이트
        if (command.title || command.category) {
          await this.repository.updateMetadata(command.imageAssetId, {
            title: command.title,
            category: command.category,
          });

          // 업데이트된 Entity 재조회
          const updatedAsset = await this.repository.findById(
            command.imageAssetId
          );
          if (!updatedAsset) {
            return Result.error(
              new ImageAssetError('NOT_FOUND', 'Image asset not found')
            );
          }

          const updatedEntity = ImageAssetEntity.fromDatabase(updatedAsset);
          const canSetPublic = updatedEntity.canSetPublic();
          if (!canSetPublic.valid) {
            return Result.error(
              new ImageAssetError('VALIDATION_FAILED', canSetPublic.reason!)
            );
          }
        } else {
          // Command에 없으면 기존 값으로 검증
          const canSetPublic = entity.canSetPublic();
          if (!canSetPublic.valid) {
            return Result.error(
              new ImageAssetError('VALIDATION_FAILED', canSetPublic.reason!)
            );
          }
        }
      }

      // 4. Repository로 공개 설정 변경
      const updatedAsset = await this.repository.updateVisibility(
        command.imageAssetId,
        command.isPublic
      );

      return Result.success(updatedAsset);
    } catch (error) {
      return Result.error(
        new ImageAssetError(
          'UPDATE_FAILED',
          error instanceof Error ? error.message : 'Failed to change visibility'
        )
      );
    }
  }

  /**
   * 이미지 자산 조회 (권한 체크 포함)
   *
   * Process Model: 모든 시나리오에서 사용
   */
  async getImageAsset(
    imageAssetId: string,
    currentUserId: string
  ): Promise<Result<ImageAsset, ImageAssetError>> {
    try {
      const imageAsset = await this.repository.findById(imageAssetId);
      if (!imageAsset) {
        return Result.error(
          new ImageAssetError('NOT_FOUND', 'Image asset not found')
        );
      }

      // Entity로 변환하여 권한 검증
      const entity = ImageAssetEntity.fromDatabase(imageAsset);
      if (!entity.canView(currentUserId)) {
        return Result.error(
          new ImageAssetError(
            'PERMISSION_DENIED',
            'You do not have permission to view this image'
          )
        );
      }

      return Result.success(imageAsset);
    } catch (error) {
      return Result.error(
        new ImageAssetError(
          'FETCH_FAILED',
          error instanceof Error ? error.message : 'Failed to fetch image asset'
        )
      );
    }
  }
}
