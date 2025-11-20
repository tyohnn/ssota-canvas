import { useState, useCallback } from 'react';
import { useOptionManagementContext } from '../../../core/context';
import { ColorToken } from '@/domains/block-management/shared/types/style-tokens.types';
import type { PropertyOption } from '@/domains/block-management/shared/value-objects/block-properties/common-types';

export function useAddStatusOption() {
  const { handleCreateOption } = useOptionManagementContext();
  const [isAddPopoverOpen, setIsAddPopoverOpen] = useState(false);
  const [pendingOption, setPendingOption] = useState<PropertyOption | null>(
    null
  );

  // Plus 버튼 클릭 시 즉시 새 옵션 생성 및 DB 저장 후 팝오버 열기 (그룹 정보 포함)
  const handleAddOption = useCallback(
    async (groupId: string) => {
      try {
        // 즉시 DB에 저장 (그룹 정보 포함, optimistic update)
        const newOption = await handleCreateOption(
          '새 옵션',
          ColorToken.GRAY,
          groupId
        );

        if (newOption) {
          setPendingOption(newOption);
          setIsAddPopoverOpen(true);
        }
      } catch (error) {
        console.error('Failed to create option:', error);
        // 에러 발생 시 팝오버를 열지 않음
      }
    },
    [handleCreateOption]
  );

  // 팝오버 닫기 핸들러
  const handleClosePopover = useCallback(() => {
    setIsAddPopoverOpen(false);
    setPendingOption(null);
  }, []);

  // Popover의 onOpenChange 핸들러
  const handlePopoverOpenChange = useCallback((open: boolean) => {
    setIsAddPopoverOpen(open);
    if (!open) {
      setPendingOption(null);
    }
  }, []);

  return {
    isAddPopoverOpen,
    pendingOption,
    handleAddOption,
    handleClosePopover,
    handlePopoverOpenChange,
  };
}
