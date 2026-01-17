/**
 * Combined Hook: UI + Business Logic
 *
 * This hook serves as the single point of entry for all external dependencies.
 */
import { useCallback, useRef } from 'react';

import type { UrlToolbarItemProps, UseUrlToolbarItemReturn } from './types';
import { useUrlToolbarItemBusiness } from './use-url-toolbar-item.business';
import { useUrlToolbarItemUI } from './use-url-toolbar-item.ui';

export function useUrlToolbarItem(
  props: UrlToolbarItemProps
): UseUrlToolbarItemReturn {
  // 1. Business Logic Hook (Engineer area)
  const business = useUrlToolbarItemBusiness({
    props,
  });

  // 2. UI State Hook (Designer area) - 먼저 생성
  const handleSubmitRef = useRef<
    ((e?: React.FormEvent) => Promise<void>) | null
  >(null);

  const uiState = useUrlToolbarItemUI({
    currentValue: props.currentValue,
    onCancel: () => {
      // Cancel은 UI 훅에서 처리
    },
    onSubmit: () => {
      // handleSubmitRef를 통해 호출
      handleSubmitRef.current?.();
    },
  });

  // 3. Handle Submit (메인 훅에서 오케스트레이션)
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      const { currentValue, onValueChange, validateUrl } = props;
      const { draftUrl, isSubmitting, setIsSubmitting, setIsOpen } = uiState;

      if (!onValueChange || isSubmitting) return;

      const trimmedUrl = draftUrl.trim();

      // URL이 비어있거나 변경되지 않았으면 그냥 닫기
      if (!trimmedUrl || trimmedUrl === currentValue) {
        setIsOpen(false);
        return;
      }

      // URL 형식 검증 (커스텀 validator가 있으면 사용, 없으면 기본 URL 검증)
      if (validateUrl) {
        if (!validateUrl(trimmedUrl)) {
          return;
        }
      } else {
        try {
          new URL(trimmedUrl);
        } catch {
          // 유효하지 않은 URL
          return;
        }
      }

      setIsSubmitting(true);
      try {
        await onValueChange(trimmedUrl);
        setIsOpen(false);
      } catch (error) {
        console.error('Failed to update URL:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      props,
      uiState.draftUrl,
      uiState.isSubmitting,
      uiState.setIsSubmitting,
      uiState.setIsOpen,
    ]
  );

  // handleSubmitRef 업데이트
  handleSubmitRef.current = handleSubmit;

  // 4. Compose and Return
  return {
    uiState,
    business,
    handleSubmit,
  };
}
