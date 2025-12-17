'use client';

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@workspace/ui/components/ui/sonner';
import {
  duplicatePageAction,
  deletePageAction,
} from '@/domains/workspace-management/actions/page.actions';
import type { PageTreeNodeDTO } from '@/domains/workspace-management/shared/dtos';

interface PageContextMenuProps {
  page: PageTreeNodeDTO;
  onOpenChange?: (open: boolean) => void; // Pass menu open state
  isParentHovered?: boolean; // Parent item hover state
  onDelete?: () => void | Promise<void>; // Optimistic delete handler
  onDuplicate?: () => void | Promise<void>; // Optimistic duplicate handler
}

/**
 * PageContextMenu component
 *
 * Page item three-dot menu
 * - Duplicate page
 * - Delete page (soft delete)
 */
export function PageContextMenu({
  page,
  onOpenChange,
  isParentHovered = false,
  onDelete,
  onDuplicate,
}: PageContextMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Pass open state to parent
  const handleOpenChange = (open: boolean) => {
    setIsMenuOpen(open);
    onOpenChange?.(open);
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (onDuplicate) {
      // PageTree의 optimistic update 사용
      setIsProcessing(true);
      try {
        await onDuplicate();
      } catch (error) {
        console.error('[duplicatePage] Error:', error);
        toast.error('페이지 복제 중 오류가 발생했습니다');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Fallback: 직접 action 호출 (하위 호환성)
      setIsProcessing(true);
      try {
        const result = await duplicatePageAction({ pageId: page.id });
        if (result.success && result.data) {
          toast.success('페이지가 복제되었습니다');
        } else {
          toast.error('페이지 복제에 실패했습니다');
        }
      } catch (error) {
        console.error('[duplicatePage] Error:', error);
        toast.error('페이지 복제 중 오류가 발생했습니다');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (onDelete) {
      // PageTree의 optimistic update 사용
      setIsProcessing(true);
      try {
        await onDelete();
      } catch (error) {
        console.error('[deletePage] Error:', error);
        toast.error('페이지 삭제 중 오류가 발생했습니다');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Fallback: 직접 action 호출 (하위 호환성)
      setIsProcessing(true);
      try {
        const result = await deletePageAction({ pageId: page.id });
        if (result.success) {
          toast.success('페이지가 삭제되었습니다');
        } else {
          toast.error('페이지 삭제에 실패했습니다');
        }
      } catch (error) {
        console.error('[deletePage] Error:', error);
        toast.error('페이지 삭제 중 오류가 발생했습니다');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            'h-4 w-4 p-0 flex items-center justify-center rounded-sm transition-all hover:bg-accent hover:text-accent-foreground cursor-pointer',
            isMenuOpen
              ? 'opacity-100'
              : isParentHovered
                ? 'opacity-100'
                : 'opacity-0'
          )}
          role="button"
          aria-label="Page menu"
          tabIndex={-1}
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <MoreHorizontal
            className={cn(
              'h-3.5 w-3.5 transition-colors',
              isMenuOpen ? 'text-foreground' : 'text-muted-foreground'
            )}
          />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="right" align="start" className="w-48">
        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate Page
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Page
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
