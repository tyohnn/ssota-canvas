/**
 * Image Change Toolbar Item Combined Hook
 *
 * UI State + Business Logic 통합
 * Optional injection 지원
 */

'use client';

import type { ImageChangeUIState, ImageChangeBusinessLogic } from './types';
import {
  useImageChangeToolbarItemBusiness,
  type useMockImageChangeToolbarItemBusiness,
} from './use-image-change-toolbar-item.business';

export interface UseImageChangeToolbarItemResult
  extends ImageChangeUIState,
    ImageChangeBusinessLogic {
  // Combined result
}

/**
 * Combined Hook
 *
 * Production: 기본 비즈니스 로직 사용
 * Test/Mock: 커스텀 로직 주입 가능
 */
export function useImageChangeToolbarItem(
  workspaceId: string,
  disabled: boolean,
  onPropertiesChange?: (properties: Record<string, any>) => Promise<void>,
  businessLogic?: ImageChangeBusinessLogic // 🎯 Optional injection
): UseImageChangeToolbarItemResult {
  // Business Logic (엔지니어 영역)
  const defaultBusiness = useImageChangeToolbarItemBusiness(
    workspaceId,
    disabled,
    onPropertiesChange
  );
  const business = businessLogic ?? defaultBusiness;

  // UI State는 없음 (Stateless 컴포넌트)

  return {
    ...business,
  };
}
