'use client';

import { Link2 } from 'lucide-react';
import { UrlToolbarItem } from '../../../common-toolbar-items/url-toolbar-item';

interface LinkUrlToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentValue: string;
  disabled?: boolean;
  onValueChange?: (url: string) => Promise<void>;
}

/**
 * Link URL Toolbar Item
 *
 * 링크 URL 편집을 위한 툴바 아이템
 * - UrlToolbarItem 공통 컴포넌트 사용
 * - URL 변경 시 메타데이터 자동 fetch
 */
export function LinkUrlToolbarItem({
  blockId,
  blockMountId,
  currentValue,
  disabled = false,
  onValueChange,
}: LinkUrlToolbarItemProps) {
  return (
    <UrlToolbarItem
      blockId={blockId}
      blockMountId={blockMountId}
      currentValue={currentValue}
      disabled={disabled}
      onValueChange={onValueChange}
      icon={Link2}
      label="링크 편집"
      placeholder="https://..."
    />
  );
}
