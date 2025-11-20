/**
 * Image Generation Models Configuration
 *
 * 지원하는 이미지 생성 모델 목록 및 메타데이터
 *
 * ⚠️ Migrated from block-management domain to image-app-space domain
 */

export interface ImageGenerationModel {
  /** 모델 ID (provider/model 형식) */
  id: string;

  /** 표시 이름 */
  label: string;

  /** 프로바이더 (openai | google) */
  provider: 'openai' | 'google';

  /** 지원하는 크기 옵션 (width x height 형식) */
  sizeOptions?: string[];

  /** 지원하는 종횡비 옵션 (width:height 형식) */
  aspectRatioOptions?: string[];

  /** 최대 출력 개수 */
  maxOutputs: number;

  /** Negative prompt 지원 여부 */
  supportsNegativePrompt: boolean;

  /** 기본 품질 설정 */
  defaultQuality?: 'high' | 'medium' | 'low';

  /** 기본 스타일 설정 */
  defaultStyle?: 'vivid' | 'natural';

  /** 기본 종횡비 */
  defaultAspectRatio?: string;

  /** 기본 크기 */
  defaultSize?: string;

  /** Provider별 추가 옵션 */
  providerOptions?: Record<string, unknown>;
}

/**
 * 지원하는 이미지 생성 모델 목록
 */
export const IMAGE_GENERATION_MODELS: ImageGenerationModel[] = [
  {
    id: 'openai/gpt-image-1',
    label: 'GPT Image 1',
    provider: 'openai',
    sizeOptions: ['1024x1024', '1536x1024', '1024x1536'],
    maxOutputs: 1,
    supportsNegativePrompt: false,
    defaultQuality: 'medium',
    defaultSize: '1024x1024',
    providerOptions: {
      quality: 'high', // high, medium, low
    },
  },
  {
    id: 'google/gemini-2.5-flash-image',
    label: 'Gemini 2.5 Flash Image',
    provider: 'google',
    aspectRatioOptions: ['1:1', '3:4', '4:3', '16:9'],
    maxOutputs: 4,
    supportsNegativePrompt: true,
    defaultAspectRatio: '1:1',
    providerOptions: {},
  },
];

/**
 * 모델 ID로 모델 정보 조회
 */
export function getImageGenerationModel(
  modelId: string
): ImageGenerationModel | undefined {
  return IMAGE_GENERATION_MODELS.find(model => model.id === modelId);
}

/**
 * 프로바이더별 모델 목록 조회
 */
export function getModelsByProvider(
  provider: 'openai' | 'google'
): ImageGenerationModel[] {
  return IMAGE_GENERATION_MODELS.filter(model => model.provider === provider);
}
