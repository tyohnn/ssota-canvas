import { useCallback, useEffect, useRef, useState } from 'react';

import type { EdgeLabelState } from './types';

/**
 * UI State Hook for Edge Label
 *
 * 디자이너가 Storybook/노코드 툴에서 사용할 수 있는 순수 UI 로직
 * - 비즈니스 로직 없음 (API 호출, 데이터 검증 등)
 * - 로컬 상태 관리만 담당
 * - 노코드 환경에서 독립적으로 테스트 가능
 */
export interface EdgeLabelUIState {
  // Label state
  labelState: EdgeLabelState;
  setIsEditing: (editing: boolean) => void;
  setDraftLabel: (label: string) => void;
  updateOriginalLabel: (label: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export interface EdgeLabelUIDependencies {
  label: string;
}

export function useEdgeLabelUI({
  label,
}: EdgeLabelUIDependencies): EdgeLabelUIState {
  // Label editing state
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const originalLabelRef = useRef('');

  // Sync label when external data changes (if not editing)
  useEffect(() => {
    if (!isEditing) {
      setDraftLabel(label);
      originalLabelRef.current = label;
    }
  }, [label, isEditing]);

  // Expose method to update original label (used after successful save)
  const updateOriginalLabel = useCallback((newLabel: string) => {
    originalLabelRef.current = newLabel;
  }, []);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Label state
  const labelState: EdgeLabelState = {
    label,
    isEditing,
    draftLabel,
    originalLabel: originalLabelRef.current,
  };

  return {
    labelState,
    setIsEditing,
    setDraftLabel,
    updateOriginalLabel,
    inputRef,
  };
}
