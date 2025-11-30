/**
 * Image Generation Service
 *
 * AI 이미지 생성 서비스
 * - OpenAI GPT Image 1
 * - Google Gemini 2.5 Flash Image
 *
 * ⚠️ Migrated from block-management domain to image-app-space domain
 */

import { experimental_generateImage as generateImage } from 'ai';
import type { Experimental_GeneratedImage } from 'ai';
import {
  createHeliconeOpenAI,
  createHeliconeGoogle,
  buildHeliconeHeaders,
} from '@/domains/ai-management/backend/providers/helicone-provider';
import {
  getImageGenerationModel,
  type ImageGenerationModel,
} from '../../shared/config/image-generation-models';
import {
  uploadGeneratedImageToStorage,
  type UploadGeneratedAssetResult,
} from './storage/generated-image-upload.service';
import type {
  ImageAsset,
  ImageAssetMetadata,
} from '../../shared/types/image-search.types';
import type { ImageGenerationResult } from '../../shared/types/image-generation.types';
import type { GenerateImageRequest } from '../../shared/dtos/requests/image-generation.requests';
import { DrizzleImageAssetRepository } from '../repositories/implementations/drizzle-image-asset.repository';
import { ImageAssetService } from './image-asset.service';
import { createHash } from 'crypto';

/**
 * Image Generation Service
 */
export class ImageGenerationService {
  /**
   * 이미지 생성 실행
   *
   * @param request - 생성 요청
   * @param userId - 사용자 ID (Helicone 헤더용 + DB 저장용)
   * @param pageId - 페이지 ID (Storage 경로용)
   * @param blockId - 블록 ID (Storage 경로용)
   * @returns 생성 결과
   */
  async generate(
    request: GenerateImageRequest,
    userId: string,
    pageId: string,
    blockId: string
  ): Promise<ImageGenerationResult> {
    const startTime = Date.now();

    // 모델 정보 조회
    const model = getImageGenerationModel(request.modelId);
    if (!model) {
      throw new Error(`Unsupported model: ${request.modelId}`);
    }

    // Helicone 헤더 생성
    const headers = buildHeliconeHeaders({
      userId,
      feature: 'image-generate',
      model: request.modelId,
    });

    // Provider 선택 및 모델 생성
    let providerModel: Parameters<typeof generateImage>[0]['model'];
    if (model.provider === 'openai') {
      const openai = createHeliconeOpenAI(headers);
      providerModel = openai.image('gpt-image-1');
    } else if (model.provider === 'google') {
      const google = createHeliconeGoogle(headers);
      providerModel = google.image('gemini-2.5-flash-image');
    } else {
      throw new Error(`Unsupported provider: ${model.provider}`);
    }

    // 이미지 생성 옵션 구성
    const generateOptions: Parameters<typeof generateImage>[0] = {
      model: providerModel,
      prompt: request.prompt,
      n: request.outputCount,
    } as Parameters<typeof generateImage>[0];

    // Negative prompt (지원하는 경우)
    if (request.negativePrompt && model.supportsNegativePrompt) {
      (generateOptions as any).negativePrompt = request.negativePrompt;
    }

    // 크기 또는 종횡비 설정
    if (model.sizeOptions && request.size) {
      generateOptions.size = request.size as `${number}x${number}`;
    } else if (model.aspectRatioOptions && request.aspectRatio) {
      generateOptions.aspectRatio =
        request.aspectRatio as `${number}:${number}`;
    } else if (model.defaultSize) {
      generateOptions.size = model.defaultSize as `${number}x${number}`;
    } else if (model.defaultAspectRatio) {
      generateOptions.aspectRatio =
        model.defaultAspectRatio as `${number}:${number}`;
    }

    // Seed 설정
    if (request.seed) {
      generateOptions.seed = request.seed;
    }

    // Provider별 옵션 추가 (비어있지 않은 경우만)
    if (
      model.providerOptions &&
      Object.keys(model.providerOptions).length > 0
    ) {
      generateOptions.providerOptions = {
        [model.provider]: model.providerOptions,
      } as any;
    }

    // 이미지 생성 실행
    const result = await generateImage(generateOptions);

    const latency = Date.now() - startTime;

    // 생성된 이미지들을 배열로 변환 (단일 또는 다중)
    const images = result.images || (result.image ? [result.image] : []);

    if (images.length === 0) {
      throw new Error('No images generated');
    }

    // 프롬프트 해시 생성 (캐싱용)
    const promptHash = createHash('md5')
      .update(request.prompt)
      .digest('hex')
      .slice(0, 8);

    // Service 인스턴스 생성 (DB 저장용)
    const repository = new DrizzleImageAssetRepository();
    const imageAssetService = new ImageAssetService(repository);

    // 각 이미지를 Supabase Storage에 업로드하고 DB에 저장
    const uploadPromises = images.map(
      async (image: Experimental_GeneratedImage, index) => {
        const base64 = image.base64 || '';
        // mediaType이 있으면 사용, 없으면 기본값 'image/png' 사용
        const mimeType = image.mediaType || 'image/png';

        // 1. Storage에 업로드
        const uploadResult = await uploadGeneratedImageToStorage({
          base64,
          mimeType,
          orgId: request.orgId,
          workspaceId: request.workspaceId,
          pageId,
          blockId,
          promptHash: `${promptHash}-${index}`,
          modelId: request.modelId,
        });

        // 2. DB에 저장 (image_assets 테이블)
        const dbResult = await imageAssetService.createImageAsset({
          assetType: 'ai-generated',
          imageUrl: uploadResult.path, // Storage path
          workspaceId: request.workspaceId,
          createdBy: userId,
          width: uploadResult.width,
          height: uploadResult.height,
          mimeType: uploadResult.mimeType,
          prompt: request.prompt,
          negativePrompt: request.negativePrompt,
          metadata: {
            modelId: request.modelId,
            aspectRatio: request.aspectRatio,
            seed: request.seed,
            blockId,
            promptHash: `${promptHash}-${index}`,
          },
        });

        if (dbResult.isError()) {
          console.error(
            '[ImageGeneration] Failed to save to DB:',
            dbResult.error
          );
          // Storage는 성공했으므로 계속 진행
        }

        // 3. ImageAsset 형식으로 변환 (기존 응답 형식 유지)
        const imageAsset: ImageAsset = {
          id: dbResult.isSuccess()
            ? dbResult.value.id
            : `generated-${request.modelId}-${promptHash}-${index}`,
          url: uploadResult.url, // Signed URL
          thumbnailUrl: uploadResult.url,
          alt: request.prompt.slice(0, 100),
          source: 'ssota',
          metadata: {
            blockId,
            createdAt: new Date(),
            workspaceId: request.workspaceId,
            width: uploadResult.width,
            height: uploadResult.height,
          },
        };

        return imageAsset;
      }
    );

    const imageAssets = await Promise.all(uploadPromises);

    return {
      images: imageAssets,
      metadata: {
        provider: model.provider,
        modelId: request.modelId,
        latency,
      },
    };
  }
}
