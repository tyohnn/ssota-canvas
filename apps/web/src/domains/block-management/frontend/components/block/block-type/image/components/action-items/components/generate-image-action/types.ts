/**
 * Generate Image Action Types
 */

import type { ImageAsset } from '@/domains/image-app-space/shared/types/image-search.types';
import type { ImageGenerationModel } from '@/domains/image-app-space/shared/config/image-generation-models';

/**
 * Apply Mode
 */
export type ApplyMode = 'replace' | 'createNew';

/**
 * Generate Image Action Props
 */
export interface GenerateImageActionProps {
  /** 초기 블록 ID 목록 */
  blockIds: string[];
}

/**
 * UI State
 */
export interface GenerateImageUIState {
  // Dialog 상태
  open: boolean;
  setOpen: (open: boolean) => void;

  // 프롬프트
  prompt: string;
  setPrompt: (prompt: string) => void;

  // Negative 프롬프트
  negativePrompt: string;
  setNegativePrompt: (negativePrompt: string) => void;

  // 모델 선택
  modelId: string;
  setModelId: (modelId: string) => void;

  // 출력 개수
  outputCount: number;
  setOutputCount: (count: number) => void;

  // 크기 또는 종횡비
  size?: string;
  setSize: (size: string) => void;
  aspectRatio?: string;
  setAspectRatio: (aspectRatio: string) => void;

  // Seed
  seedEnabled: boolean;
  setSeedEnabled: (enabled: boolean) => void;
  seedValue?: number;
  setSeedValue: (seed: number | undefined) => void;

  // 선택된 이미지
  selectedImage: ImageAsset | null;
  selectImage: (image: ImageAsset | null) => void;

  // 선택된 블록 ID 목록
  selectedBlockIds: string[];
  toggleBlockId: (blockId: string) => void;
  setSelectedBlockIds: (blockIds: string[]) => void;

  // 적용 모드
  applyMode: ApplyMode;
  setApplyMode: (mode: ApplyMode) => void;

  // Ref
  promptInputRef: React.RefObject<HTMLTextAreaElement | null>;

  // 헬퍼
  handleOpenChange: (open: boolean) => void;
  resetState: () => void;
}

/**
 * Business Logic
 */
export interface GenerateImageBusinessLogic {
  // 이미지 생성
  generateImages: (params: {
    prompt: string;
    negativePrompt?: string;
    modelId: string;
    outputCount: number;
    size?: string;
    aspectRatio?: string;
    seed?: number;
  }) => Promise<void>;

  // 이미지 적용
  applyImage: (
    image: ImageAsset,
    blockIds: string[],
    mode: ApplyMode
  ) => Promise<void>;

  // 결과 초기화
  clearResults: () => void;

  // 상태
  results: ImageAsset[];
  isGenerating: boolean;
  isApplying: boolean;
  error: Error | null;

  // 사용 가능한 모델 목록
  availableModels: ImageGenerationModel[];
}
