/**
 * Image Block Actions (Non-Hook Version)
 * AI Agent가 호출하는 순수 함수 버전
 *
 * 규약:
 * - Hook을 사용하지 않음 (React Rules 준수)
 * - executeAction 함수를 export
 * - 모든 블록 타입이 동일한 인터페이스 사용
 * - 필요한 Hook 콜백은 4번째 파라미터로 전달받음
 */

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { searchImageAssetsAction } from '@/domains/image-app-space/actions/image-search.actions';
import { generateImageAssetsAction } from '@/domains/image-app-space/actions/image-generation.actions';
import type { ImageAsset } from '@/domains/image-app-space/shared/types/image-search.types';
import { IMAGE_GENERATION_MODELS } from '@/domains/image-app-space/shared/config/image-generation-models';
import { isFailure } from '@/lib';

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export interface ActionCallbacks {
  updateProperties: (
    blockId: string,
    properties: Record<string, any>,
    blockData: BlockNodeData
  ) => Promise<void>;
  createAndMountBlock: (
    blockType: string,
    position: { x: number; y: number },
    initialProperties?: Record<string, any>,
    initialContent?: unknown,
    title?: string
  ) => Promise<any>;
  calculatePosition: (
    blockType: string,
    selectedBlockIds?: string[]
  ) => { x: number; y: number };
  blockId: string;
}

/**
 * Helper: 이미지 메타데이터 빌드
 * use-image-search.business.ts의 buildMetadata와 동일
 */
function buildImageMetadata(image: ImageAsset): Record<string, unknown> {
  if (image.source === 'unsplash') {
    return {
      unsplashAuthorName: image.metadata.authorName,
      unsplashAuthorLink: image.metadata.authorLink,
      caption: `Photo by ${image.metadata.authorName} on Unsplash`,
      isCaptionVisible: true,
    };
  }

  // SSOTA 이미지
  return {
    ssotaBlockId: image.metadata.blockId,
    caption: image.alt || '',
    isCaptionVisible: !!image.alt,
  };
}

/**
 * Helper: 이미지 properties 빌드
 */
function buildImageProperties(
  image: ImageAsset,
  query: string
): Record<string, any> {
  const metadata = buildImageMetadata(image);
  return {
    imageUrl: image.url,
    imageSource: image.source,
    alt: image.alt || `Image: ${query}`,
    ...metadata,
  };
}

/**
 * 이미지 검색 수행
 */
async function searchImages(params: {
  orgId: string;
  workspaceId: string;
  query: string;
}): Promise<ActionResult> {
  const { orgId, workspaceId, query } = params;

  try {
    const searchResult = await searchImageAssetsAction({
      orgId,
      workspaceId,
      query,
      searchType: 'keyword',
      topK: 12,
      page: 1,
    });

    if (!searchResult.success) {
      return {
        success: false,
        error: searchResult.error || 'Image search failed',
      };
    }

    const images = searchResult.data.images;

    if (images.length === 0) {
      return {
        success: true,
        message: `No images found for "${query}". Try a different search term.`,
        data: { images: [], count: 0 },
      };
    }

    return {
      success: true,
      message: `Found ${images.length} images for "${query}"`,
      data: { images, count: images.length },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * imageSearch 액션 처리
 * 검색 결과만 반환 (이미지 적용은 AI가 addBlock/updateProperties로 처리)
 */
async function handleImageSearch(
  params: Record<string, any>,
  blockData: BlockNodeData
): Promise<ActionResult> {
  const { query } = params;

  if (!query) {
    return {
      success: false,
      error: 'query parameter is required for imageSearch',
    };
  }

  const { orgId, workspaceId } = blockData;

  // 이미지 검색 결과 반환
  const searchResult = await searchImages({ orgId, workspaceId, query });

  if (!searchResult.success || !searchResult.data?.images) {
    return searchResult;
  }

  const images = searchResult.data.images;

  return {
    success: true,
    message: `Found ${images.length} images for "${query}"`,
    data: {
      images: images.map((image: ImageAsset) => ({
        url: image.url,
        source: image.source,
        alt: image.alt,
        metadata: image.metadata,
        // AI가 사용할 수 있는 properties 형태로 제공
        properties: buildImageProperties(image, query),
      })),
      count: images.length,
      query,
    },
  };
}

/**
 * Helper: aspectRatio를 OpenAI size로 변환
 */
function convertAspectRatioToSize(aspectRatio: string): string {
  const sizeMap: Record<string, string> = {
    '1:1': '1024x1024',
    '3:2': '1536x1024',
    '2:3': '1024x1536',
    // 다른 비율들은 가장 가까운 size로 매핑
    '4:3': '1536x1024', // 3:2와 유사
    '3:4': '1024x1536', // 2:3과 유사
    '16:9': '1536x1024', // 가로형
    '9:16': '1024x1536', // 세로형
  };
  return sizeMap[aspectRatio] || '1024x1024';
}

/**
 * Helper: 프롬프트에서 짧은 제목 생성 (앞 5단어)
 */
function generateShortTitle(prompt: string, maxWords: number = 5): string {
  const words = prompt.trim().split(/\s+/).slice(0, maxWords).join(' ');
  return words.length > 0 ? words : prompt.slice(0, 30);
}

/**
 * Helper: 이미지 생성 캡션 생성
 */
function generateImageCaption(prompt: string, index: number): string {
  const shortPrompt = generateShortTitle(prompt);
  return `${shortPrompt} (${index + 1})`;
}

/**
 * generateImage 액션 처리
 */
async function handleGenerateImage(
  params: Record<string, any>,
  blockData: BlockNodeData,
  callbacks?: ActionCallbacks
): Promise<ActionResult> {
  const { prompt, modelId, negativePrompt, aspectRatio } = params;

  if (!prompt) {
    return {
      success: false,
      error: 'prompt parameter is required for generateImage',
    };
  }

  if (!callbacks) {
    return {
      success: false,
      error: 'callbacks are required for generateImage action',
    };
  }

  const { orgId, workspaceId, pageId, blockId } = blockData;

  try {
    // 기본 모델 ID: Google Gemini
    const targetModelId = modelId || 'google/gemini-2.5-flash-image';

    // 모델 정보 조회
    const model = IMAGE_GENERATION_MODELS.find(m => m.id === targetModelId);
    if (!model) {
      return {
        success: false,
        error: `Unknown model: ${targetModelId}`,
      };
    }

    // 고정값: 4개 생성
    const outputCount = 4;

    // aspectRatio 기본값
    const targetAspectRatio = aspectRatio || '1:1';

    // OpenAI 모델인 경우 aspectRatio를 size로 변환
    let size: string | undefined;
    let finalAspectRatio: string | undefined;

    if (model.provider === 'openai') {
      size = convertAspectRatioToSize(targetAspectRatio);
      finalAspectRatio = undefined; // OpenAI는 size 사용
    } else {
      size = undefined; // Google은 aspectRatio 사용
      finalAspectRatio = targetAspectRatio;
    }

    // 이미지 생성 실행
    const result = await generateImageAssetsAction(
      {
        orgId,
        workspaceId,
        prompt,
        negativePrompt,
        modelId: targetModelId,
        outputCount,
        size,
        aspectRatio: finalAspectRatio,
      },
      pageId,
      blockId
    );

    if (isFailure(result)) {
      return {
        success: false,
        error: result.error || 'Image generation failed',
      };
    }

    const images = result.data.images;

    if (images.length === 0) {
      return {
        success: false,
        error: 'No images generated. Try adjusting your prompt.',
      };
    }

    // 모든 이미지를 새 블록으로 생성
    const createdBlocks = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      // 블록 위치 계산 (현재 블록 기준 오른쪽/아래로 배치)
      const position = callbacks.calculatePosition('image', [
        callbacks.blockId,
      ]);
      // 각 블록을 오른쪽으로 300px씩 이동
      position.x += i * 300;

      // 캡션 생성 (프롬프트 앞 5단어 + 번호)
      const caption = generateImageCaption(prompt, i);

      // 새 이미지 블록 생성
      const newBlock = await callbacks.createAndMountBlock(
        'image',
        position,
        {
          imageUrl: image.url,
          imageSource: image.source,
          alt: image.alt,
          caption,
          isCaptionVisible: false,
        },
        undefined, // initialContent
        caption // title
      );

      if (newBlock) {
        createdBlocks.push({
          blockId: newBlock.blockId,
          blockMountId: newBlock.blockMountId,
          imageUrl: image.url,
        });
      }
    }

    return {
      success: true,
      message: `Generated ${images.length} image(s) for "${prompt}". Created ${createdBlocks.length} new block(s).`,
      data: {
        blocks: createdBlocks,
        images: images.map((image: ImageAsset) => ({
          url: image.url,
          source: image.source,
          alt: image.alt,
          metadata: image.metadata,
        })),
        count: images.length,
        prompt,
        modelId: targetModelId,
        aspectRatio: targetAspectRatio,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * editImage 액션 처리
 */
async function handleEditImage(
  params: Record<string, any>,
  blockData: BlockNodeData,
  callbacks?: ActionCallbacks
): Promise<ActionResult> {
  // TODO: Implement
  return {
    success: false,
    error: 'editImage action not yet implemented',
  };
}

/**
 * Image 블록의 모든 액션을 처리하는 통합 실행 함수
 *
 * @param blockData - 블록 데이터
 * @param action - 액션 이름 (imageSearch, generateImage, etc.)
 * @param params - 액션 파라미터
 * @param callbacks - Hook 콜백들 (각 액션에서 필요한 처리를 직접 수행)
 */
export async function executeAction(
  blockData: BlockNodeData,
  action: string,
  params: Record<string, any>,
  callbacks?: ActionCallbacks
): Promise<ActionResult> {
  const { workspaceId, orgId, pageId } = blockData;

  // 필수 데이터 검증
  if (!workspaceId || !orgId || !pageId) {
    return {
      success: false,
      error: 'Missing workspaceId, orgId, or pageId in block data',
    };
  }

  // 액션별 분기
  switch (action) {
    case 'imageSearch':
      return await handleImageSearch(params, blockData);

    case 'generateImage':
      return await handleGenerateImage(params, blockData, callbacks);

    case 'editImage':
      return await handleEditImage(params, blockData, callbacks);

    default:
      return {
        success: false,
        error: `Unknown action for image block: ${action}`,
      };
  }
}
