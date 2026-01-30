/**
 * Visual Summary Action UI Hook
 * 
 * 순수 UI 상태 관리만 담당 (비즈니스 로직 없음)
 */

'use client';

import { useState } from 'react';

export interface VisualSummaryActionUIReturn {
  // UI 상태
  isPopoverOpen: boolean;
  selectedTemplateId: string | null;
  selectedLanguage: string;

  // UI 상태 업데이트
  setIsPopoverOpen: (open: boolean) => void;
  setSelectedTemplateId: (templateId: string | null) => void;
}

/**
 * Visual Summary Action UI 훅
 * 
 * 순수 UI 상태만 관리 (비즈니스 데이터 의존 없음)
 */
export function useVisualSummaryActionUI(): VisualSummaryActionUIReturn {
  // UI 상태
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedLanguage] = useState('ko'); // 기본 언어

  return {
    // UI 상태
    isPopoverOpen,
    selectedTemplateId,
    selectedLanguage,

    // UI 상태 업데이트
    setIsPopoverOpen,
    setSelectedTemplateId,
  };
}
