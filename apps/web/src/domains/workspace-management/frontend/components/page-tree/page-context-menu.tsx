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
import type { PageTreeNodeDTO } from '@/domains/workspace-management/shared/dtos';
import { useWorkspace } from '../../index';

interface PageContextMenuProps {
  page: PageTreeNodeDTO;
  onOpenChange?: (open: boolean) => void; // Pass menu open state
  isParentHovered?: boolean; // Parent item hover state
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
}: PageContextMenuProps) {
  const { duplicatePage, deletePage } = useWorkspace();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Pass open state to parent
  const handleOpenChange = (open: boolean) => {
    setIsMenuOpen(open);
    onOpenChange?.(open);
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await duplicatePage(page.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await deletePage(page.id);
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
