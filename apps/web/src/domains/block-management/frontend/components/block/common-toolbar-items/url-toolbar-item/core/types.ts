/**
 * URL Toolbar Item Types
 *
 * URL 편집을 위한 공통 툴바 아이템 컴포넌트의 타입 정의
 */
import type { LucideIcon } from 'lucide-react';

export interface UrlToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentValue: string;
  disabled?: boolean;
  onValueChange?: (url: string) => Promise<void>;
  // 커스터마이징 옵션
  icon: LucideIcon;
  label: string;
  placeholder?: string;
  validateUrl?: (url: string) => boolean;
}

export interface UrlToolbarItemUIState {
  isOpen: boolean;
  draftUrl: string;
  isSubmitting: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setIsOpen: (open: boolean) => void;
  setDraftUrl: (url: string) => void;
  setIsSubmitting: (submitting: boolean) => void;
  handleOpenChange: (open: boolean) => void;
  handleCancel: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export interface UrlToolbarItemBusinessLogic {
  // 비즈니스 로직이 필요한 경우 여기에 추가
}

export interface UseUrlToolbarItemReturn {
  uiState: UrlToolbarItemUIState;
  business: UrlToolbarItemBusinessLogic;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
}
