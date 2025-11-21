'use client';

import React, { useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@workspace/ui/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';
import {
  FileText,
  Image,
  Video,
  Map,
  Square,
  Circle,
  Code,
  Link,
  File,
  MessageSquare,
  Github,
  Zap,
  Music,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvasMode } from '../../hooks/use-canvas-mode';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

/**
 * Block Type 정의 (임시)
 */
interface BlockTypeInfo {
  type: BlockType;
  displayName: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  category?: string;
  isPreparing?: boolean; // 준비 중인 블록
}

/**
 * 기본 블럭 타입 목록 (Command 컴포넌트용으로 확장)
 * Block Management Domain의 SUPPORTED_BLOCK_TYPES와 동기화
 */
const DEFAULT_BLOCK_TYPES: BlockTypeInfo[] = [
  // Basic - Most frequently used blocks
  {
    type: BlockType.MARKDOWN,
    displayName: 'Markdown',
    icon: MessageSquare,
    description: 'Rich text with markdown support',
    category: 'Basic',
  },
  {
    type: BlockType.TEXT,
    displayName: 'Sticker',
    icon: FileText,
    description: 'Quick text note',
    category: 'Basic',
  },
  {
    type: BlockType.SHAPE,
    displayName: 'Shape',
    icon: Square,
    description: 'Geometric shapes',
    category: 'Basic',
  },
  // Media
  {
    type: BlockType.IMAGE,
    displayName: 'Image',
    icon: Image,
    description: 'Upload or embed images',
    category: 'Media',
  },
  {
    type: BlockType.YOUTUBE,
    displayName: 'YouTube',
    icon: Video,
    description: 'Embed YouTube videos',
    category: 'Media',
  },
  {
    type: BlockType.AUDIO,
    displayName: 'Audio',
    icon: Music,
    description: 'Audio files and players',
    category: 'Media',
  },
  {
    type: BlockType.PDF,
    displayName: 'PDF',
    icon: FileText,
    description: 'PDF document viewer',
    category: 'Media',
  },
  // Content
  {
    type: BlockType.LINK,
    displayName: 'Link',
    icon: Link,
    description: 'Link preview with metadata',
    category: 'Content',
  },
  // Code
  {
    type: BlockType.PYTHON,
    displayName: 'Python Code',
    icon: Code,
    description: 'Execute Python code',
    category: 'Code',
  },
  // Preparing - Blocks in development
  {
    type: BlockType.PAGE_MENTION,
    displayName: 'Page Mention',
    icon: FileText,
    description: 'Reference other pages',
    category: 'Preparing',
    isPreparing: true,
  },
  {
    type: BlockType.LATEX,
    displayName: 'LaTeX',
    icon: Code,
    description: 'Mathematical formulas',
    category: 'Preparing',
    isPreparing: true,
  },
  {
    type: BlockType.FILE,
    displayName: 'File',
    icon: File,
    description: 'File attachment',
    category: 'Preparing',
    isPreparing: true,
  },
  {
    type: BlockType.GITHUB_PR,
    displayName: 'GitHub PR',
    icon: Github,
    description: 'GitHub pull request preview',
    category: 'Preparing',
    isPreparing: true,
  },
  {
    type: BlockType.REACT_COMPONENT,
    displayName: 'React Component',
    icon: Zap,
    description: 'Custom React component',
    category: 'Preparing',
    isPreparing: true,
  },
];

/**
 * BlockAddDialog Props
 */
export interface BlockAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlockType: (blockType: BlockType) => void;
  workspaceId?: string;
}

/**
 * BlockAddDialog Component
 *
 * Command 컴포넌트를 사용한 블럭 타입 선택 다이얼로그
 * 더 나은 키보드 네비게이션과 검색 기능 제공
 */
export function BlockAddDialog({
  isOpen,
  onClose,
  onSelectBlockType,
  workspaceId,
}: BlockAddDialogProps) {
  const canvasMode = useCanvasMode();

  // 카테고리별로 그룹화된 블럭 타입
  const blockTypesByCategory = DEFAULT_BLOCK_TYPES.reduce(
    (acc, blockTypeInfo) => {
      const category = blockTypeInfo.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(blockTypeInfo);
      return acc;
    },
    {} as Record<string, BlockTypeInfo[]>
  );

  const handleSelectBlockType = (blockType: BlockType) => {
    // useCanvasMode Hook을 사용하여 블럭 생성 모드 진입
    canvasMode.enterBlockCreationMode(blockType);

    // 기존 콜백도 호출 (하위 호환성)
    onSelectBlockType(blockType);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[450px] p-0 rounded-md">
        <DialogHeader className="px-4 py-3 border-b border-border/30">
          <DialogTitle>Select Block Type</DialogTitle>
          <DialogDescription>
            Choose a block type to add to your canvas.
          </DialogDescription>
        </DialogHeader>

        <Command className="rounded-md border-0">
          <CommandInput
            placeholder="Search block types..."
            className="border-0 focus:ring-0 rounded-md"
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {Object.entries(blockTypesByCategory).map(
              ([category, blockTypeInfos], index) => (
                <React.Fragment key={category}>
                  <CommandGroup heading={category}>
                    {blockTypeInfos.map((blockTypeInfo, blockIndex) => {
                      const IconComponent = blockTypeInfo.icon;
                      const isPreparing = blockTypeInfo.isPreparing;
                      return (
                        <CommandItem
                          key={`${category}-${blockTypeInfo.type}-${blockIndex}`}
                          value={`${blockTypeInfo.displayName} ${blockTypeInfo.description}`}
                          onSelect={() => {
                            if (!isPreparing) {
                              handleSelectBlockType(blockTypeInfo.type);
                            }
                          }}
                          disabled={isPreparing}
                          className={cn(
                            'flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors',
                            isPreparing
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-accent hover:text-accent-foreground cursor-pointer'
                          )}
                        >
                          <IconComponent className="h-4 w-4" />
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {blockTypeInfo.displayName}
                              </span>
                              {isPreparing && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  Preparing
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {blockTypeInfo.description}
                            </span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  {index < Object.keys(blockTypesByCategory).length - 1 && (
                    <CommandSeparator className="bg-border/50" />
                  )}
                </React.Fragment>
              )
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
