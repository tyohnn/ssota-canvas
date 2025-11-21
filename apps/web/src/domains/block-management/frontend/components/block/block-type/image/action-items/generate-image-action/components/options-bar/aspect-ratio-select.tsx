/**
 * Aspect Ratio Select Component
 */

'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/ui/select';
import { useGenerateImageActionContext } from '../../generate-image-action.context';

/**
 * Size/Aspect Ratio 옵션 (통합)
 */
const SIZE_RATIO_OPTIONS = {
  // OpenAI size 옵션 → 비율로 변환
  '1024x1024': { label: '1:1', ratio: '1:1' },
  '1536x1024': { label: '3:2', ratio: '3:2' },
  '1024x1536': { label: '2:3', ratio: '2:3' },
  // Google aspectRatio 옵션
  '1:1': { label: '1:1', ratio: '1:1' },
  '3:4': { label: '3:4', ratio: '3:4' },
  '4:3': { label: '4:3', ratio: '4:3' },
  '9:16': { label: '9:16', ratio: '9:16' },
  '16:9': { label: '16:9', ratio: '16:9' },
};

/**
 * Aspect Ratio / Size Select Component
 */
export function AspectRatioSelect(): React.ReactElement | null {
  const {
    aspectRatio,
    setAspectRatio,
    size,
    setSize,
    isGenerating,
    availableModels,
    modelId,
  } = useGenerateImageActionContext();

  // 현재 선택된 모델 정보
  const currentModel = availableModels.find(m => m.id === modelId);
  const supportsAspectRatio = currentModel?.aspectRatioOptions !== undefined;
  const supportsSize = currentModel?.sizeOptions !== undefined;

  // 둘 다 지원하지 않으면 표시하지 않음
  if (!supportsAspectRatio && !supportsSize) {
    return null;
  }

  // OpenAI (size) 또는 Google (aspectRatio) 옵션 구성
  const options = supportsSize
    ? (currentModel?.sizeOptions || []).map((sizeOption: string) => ({
        value: sizeOption,
        label:
          SIZE_RATIO_OPTIONS[sizeOption as keyof typeof SIZE_RATIO_OPTIONS]
            ?.label || sizeOption,
      }))
    : (currentModel?.aspectRatioOptions || []).map((ratio: string) => ({
        value: ratio,
        label:
          SIZE_RATIO_OPTIONS[ratio as keyof typeof SIZE_RATIO_OPTIONS]?.label ||
          ratio,
      }));

  // 현재 선택된 값 (size 또는 aspectRatio)
  const currentValue = supportsSize ? size : aspectRatio;

  // 값 변경 핸들러
  const handleValueChange = (value: string) => {
    if (supportsSize) {
      setSize(value);
      // size를 aspectRatio로 변환해서 프리뷰에 반영
      const ratio =
        SIZE_RATIO_OPTIONS[value as keyof typeof SIZE_RATIO_OPTIONS]?.ratio;
      if (ratio) {
        setAspectRatio(ratio);
      }
    } else {
      setAspectRatio(value);
    }
  };

  return (
    <Select
      value={currentValue || options[0]?.value}
      onValueChange={handleValueChange}
      disabled={isGenerating}
    >
      <SelectTrigger className="h-8 w-[90px] text-xs">
        <SelectValue placeholder="비율" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option: { value: string; label: string }) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="text-xs">{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
