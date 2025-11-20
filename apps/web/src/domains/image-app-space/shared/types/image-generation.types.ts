/**
 * Image Generation Types
 *
 * ⚠️ Migrated from block-management domain to image-app-space domain
 */

import type { ImageAsset } from './image-search.types';

/**
 * Image Generation Result
 */
export interface ImageGenerationResult {
  /** 생성된 이미지 목록 */
  images: ImageAsset[];

  /** 생성 메타데이터 */
  metadata: {
    /** 프로바이더 */
    provider: string;

    /** 모델 ID */
    modelId: string;

    /** 생성 시간 (ms) */
    latency?: number;

    /** 사용된 토큰 수 (있는 경우) */
    tokens?: number;
  };
}
