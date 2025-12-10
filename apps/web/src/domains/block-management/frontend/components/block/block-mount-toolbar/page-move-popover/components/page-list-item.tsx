'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { File } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import { usePageMovePopoverContext } from '../core/context';
import type { RecentPageDTO } from '@/domains/workspace-management/shared/dtos';
import { Box } from '@workspace/ui/components/ui/box';

interface PageListItemProps {
  page: RecentPageDTO;
}

export function PageListItem({ page }: PageListItemProps) {
  const { currentPageId, canMoveTo, handleSelectPage } =
    usePageMovePopoverContext();
  const isCurrentPage = page.pageId === currentPageId;
  const disabled = !canMoveTo(page.pageId);

  // 동적 아이콘 렌더링 (WorkspaceIcon 패턴 사용)
  const iconName = page.icon?.trim() || 'File';
  const IconComponent = (Icons as Record<string, any>)[iconName] || File;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSelectPage(page.pageId)}
      disabled={disabled}
      className="w-full justify-start gap-2 h-auto py-1.5"
    >
      <IconComponent className="h-4 w-4 text-muted-foreground shrink-0" />
      <Box className="flex-1 text-left min-w-0">
        <p className="font-medium truncate">{page.title}</p>
        {isCurrentPage && (
          <p className="text-xs text-muted-foreground font-normal">
            Current Page
          </p>
        )}
      </Box>
    </Button>
  );
}
