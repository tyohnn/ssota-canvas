/**
 * ImageAsset Service Interface
 *
 * Technical Specification 참조: 04-technical-specification.md
 * Service Layer 계약 정의 (테스트 용이성 및 의존성 역전)
 */

import { Result } from '@/utils/result';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';
import { ImageAssetError } from '../image-asset.service';
import type {
  CreateImageAssetCommand,
  UpdateImageMetadataCommand,
  ChangeImageVisibilityCommand,
} from '../../../shared/commands/image-asset.commands';

/**
 * ImageAsset Service Interface
 *
 * 이미지 자산 비즈니스 로직 계약
 */
export interface IImageAssetService {
  /**
   * 이미지 자산 생성
   *
   * Process Model: Scenario 1 - AI 이미지 생성 후 저장
   */
  createImageAsset(
    command: CreateImageAssetCommand
  ): Promise<Result<ImageAsset, ImageAssetError>>;

  /**
   * 메타데이터 업데이트
   *
   * Process Model: Scenario 6 - 메타데이터 편집
   */
  updateMetadata(
    command: UpdateImageMetadataCommand,
    currentUserId: string
  ): Promise<Result<ImageAsset, ImageAssetError>>;

  /**
   * 공개 설정 변경
   *
   * Process Model: Scenario 7 - Public 전환
   */
  changeVisibility(
    command: ChangeImageVisibilityCommand,
    currentUserId: string
  ): Promise<Result<ImageAsset, ImageAssetError>>;

  /**
   * 이미지 자산 조회 (권한 체크 포함)
   *
   * Process Model: 모든 시나리오에서 사용
   */
  getImageAsset(
    imageAssetId: string,
    currentUserId: string
  ): Promise<Result<ImageAsset, ImageAssetError>>;
}
