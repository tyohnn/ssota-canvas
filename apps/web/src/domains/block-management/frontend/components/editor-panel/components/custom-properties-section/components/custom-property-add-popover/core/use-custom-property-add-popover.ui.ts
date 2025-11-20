import { useCallback, useRef, useState, type RefObject } from 'react';

/**
 * UI State Hook for Property Add Popover
 *
 * 디자이너가 Framer/노코드 툴에서 사용할 수 있는 순수 UI 로직
 * - 비즈니스 로직 없음 (API 호출, 데이터 검증 등)
 * - 로컬 상태 관리만 담당
 * - 노코드 환경에서 독립적으로 테스트 가능
 */

export interface PropertyAddPopoverUIState {
  // UI 상태
  open: boolean;
  propertyName: string;
  icon: string | null;

  // UI 액션
  setOpen: (open: boolean) => void;
  setPropertyName: (name: string) => void;
  setIcon: (icon: string | null) => void;
  handleOpenChange: (open: boolean) => void;

  // Ref
  inputRef: RefObject<HTMLInputElement | null>;
}

export function usePropertyAddPopoverUI(): PropertyAddPopoverUIState {
  const [open, setOpen] = useState(false);
  const [propertyName, setPropertyName] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      // Reset form when closing
      setPropertyName('');
      setIcon(null);
    }
  }, []);

  return {
    open,
    propertyName,
    icon,
    setOpen,
    setPropertyName,
    setIcon,
    handleOpenChange,
    inputRef,
  };
}
