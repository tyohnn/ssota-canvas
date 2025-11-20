/**
 * Generate Image UI State Hook
 *
 * UI 상태만 관리 (비즈니스 로직 없음)
 * 노코드 환경에서 독립적으로 테스트 가능
 */

import { useState, useCallback, useRef } from 'react';
import type { GenerateImageUIState, ApplyMode } from './types';
import type { ImageAsset } from '@/domains/image-app-space/shared/types/image-search.types';
import { IMAGE_GENERATION_MODELS } from '@/domains/image-app-space/shared/config/image-generation-models';

/**
 * UI State Hook
 *
 * 특징:
 * - 비즈니스 로직 없음
 * - 로컬 상태만 관리
 * - API 호출 없음
 */
export function useGenerateImageUI(
  initialBlockIds: string[]
): GenerateImageUIState {
  // Dialog 상태
  const [open, setOpen] = useState(false);

  // 프롬프트
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');

  // 모델 선택 (기본값: 첫 번째 모델)
  const [modelId, setModelId] = useState<string>(
    IMAGE_GENERATION_MODELS[0]?.id || ''
  );

  // 출력 개수
  const [outputCount, setOutputCount] = useState(1);

  // 크기/종횡비
  const [size, setSize] = useState<string | undefined>('1024x1024'); // OpenAI 기본값
  const [aspectRatio, setAspectRatio] = useState<string | undefined>('1:1'); // 기본값 1:1

  // Seed
  const [seedEnabled, setSeedEnabled] = useState(false);
  const [seedValue, setSeedValue] = useState<number | undefined>();

  // 선택 상태
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] =
    useState<string[]>(initialBlockIds);

  // 적용 모드
  const [applyMode, setApplyMode] = useState<ApplyMode>('replace');

  // Ref
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);

  /**
   * Dialog 열림/닫힘 핸들러
   */
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      // 닫힐 때 모든 상태 초기화
      if (!nextOpen) {
        setPrompt('');
        setNegativePrompt('');
        setSelectedImage(null);
        setOutputCount(1);
        setSeedEnabled(false);
        setSeedValue(undefined);
        setSize(undefined);
        setAspectRatio(undefined);
        setSelectedBlockIds(initialBlockIds);
        setApplyMode('replace');
      }

      // 열릴 때 프롬프트 입력창 포커스
      if (nextOpen) {
        setTimeout(() => {
          promptInputRef.current?.focus();
        }, 100);
      }
    },
    [initialBlockIds]
  );

  /**
   * 이미지 선택 핸들러
   */
  const selectImage = useCallback((image: ImageAsset | null) => {
    setSelectedImage(image);
  }, []);

  /**
   * 블록 ID 토글 핸들러
   */
  const toggleBlockId = useCallback((blockId: string) => {
    setSelectedBlockIds(prev => {
      if (prev.includes(blockId)) {
        // 이미 선택된 경우 제거 (최소 1개는 유지)
        return prev.length > 1 ? prev.filter(id => id !== blockId) : prev;
      } else {
        // 선택되지 않은 경우 추가
        return [...prev, blockId];
      }
    });
  }, []);

  /**
   * 상태 초기화
   */
  const resetState = useCallback(() => {
    setPrompt('');
    setNegativePrompt('');
    setSelectedImage(null);
    setOutputCount(1);
    setSeedEnabled(false);
    setSeedValue(undefined);
    setSize(undefined);
    setAspectRatio(undefined);
    setSelectedBlockIds(initialBlockIds);
    setApplyMode('replace');
  }, [initialBlockIds]);

  return {
    // Dialog
    open,
    setOpen,

    // 프롬프트
    prompt,
    setPrompt,
    negativePrompt,
    setNegativePrompt,

    // 모델
    modelId,
    setModelId,

    // 출력 옵션
    outputCount,
    setOutputCount,
    size,
    setSize,
    aspectRatio,
    setAspectRatio,

    // Seed
    seedEnabled,
    setSeedEnabled,
    seedValue,
    setSeedValue,

    // 선택
    selectedImage,
    selectImage,
    selectedBlockIds,
    toggleBlockId,
    setSelectedBlockIds,

    // 적용 모드
    applyMode,
    setApplyMode,

    // Ref
    promptInputRef,

    // 헬퍼
    handleOpenChange,
    resetState,
  };
}
