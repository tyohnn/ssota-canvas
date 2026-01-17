'use client';

import { Link2 } from 'lucide-react';

import { UrlToolbarItem } from '@/domains/block-management/frontend/components/block/common-toolbar-items/url-toolbar-item';

interface YouTubeUrlToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentValue: string;
  disabled?: boolean;
  onValueChange?: (url: string) => Promise<void>;
}

/**
 * YouTube URL Toolbar Item
 *
 * YouTube URL 편집을 위한 툴바 아이템
 * - UrlToolbarItem 공통 컴포넌트 사용
 * - URL 변경 시 메타데이터 자동 fetch
 */
export function YouTubeUrlToolbarItem({
  blockId,
  blockMountId,
  currentValue,
  disabled = false,
  onValueChange,
}: YouTubeUrlToolbarItemProps) {
  // YouTube URL 검증 함수
  const validateYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  return (
    <UrlToolbarItem
      blockId={blockId}
      blockMountId={blockMountId}
      currentValue={currentValue}
      disabled={disabled}
      onValueChange={onValueChange}
      icon={Link2}
      label="Edit YouTube URL"
      placeholder="https://www.youtube.com/watch?v=..."
      validateUrl={validateYouTubeUrl}
    />
  );
}
