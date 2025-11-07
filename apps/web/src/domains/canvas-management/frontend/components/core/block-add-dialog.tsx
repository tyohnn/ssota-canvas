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
}

/**
 * 기본 블럭 타입 목록 (Command 컴포넌트용으로 확장)
 * Block Management Domain의 SUPPORTED_BLOCK_TYPES와 동기화
 */
const DEFAULT_BLOCK_TYPES: BlockTypeInfo[] = [
  {
    type: BlockType.TEXT,
    displayName: 'Text',
    icon: FileText,
    description: '텍스트 편집 블럭',
    category: 'Basic',
  },
  {
    type: BlockType.MARKDOWN,
    displayName: 'Markdown',
    icon: MessageSquare,
    description: '마크다운 문서 블럭',
    category: 'Content',
  },
  {
    type: BlockType.YOUTUBE,
    displayName: 'YouTube',
    icon: Video,
    description: '유튜브 비디오 블럭',
    category: 'Media',
  },
  {
    type: BlockType.AUDIO,
    displayName: 'Audio',
    icon: Music,
    description: '오디오 파일 블럭',
    category: 'Media',
  },
  {
    type: BlockType.PYTHON,
    displayName: 'Python Code',
    icon: Code,
    description: '파이썬 코드 실행 블럭',
    category: 'Code',
  },
  {
    type: BlockType.IMAGE,
    displayName: 'Image',
    icon: Image,
    description: '이미지 블럭',
    category: 'Media',
  },
  {
    type: BlockType.FILE,
    displayName: 'File',
    icon: File,
    description: '파일 첨부 블럭',
    category: 'Media',
  },
  {
    type: BlockType.PDF,
    displayName: 'PDF',
    icon: FileText,
    description: 'PDF 문서 블럭',
    category: 'Media',
  },
  {
    type: BlockType.LINK,
    displayName: 'Link',
    icon: Link,
    description: '링크 미리보기 블럭',
    category: 'Content',
  },
  {
    type: BlockType.SHAPE,
    displayName: 'Shape',
    icon: Square,
    description: '도형 블럭',
    category: 'Design',
  },
  {
    type: BlockType.PAGE_MENTION,
    displayName: 'Page Mention',
    icon: FileText,
    description: '페이지 언급 블럭',
    category: 'Content',
  },
  {
    type: BlockType.LATEX,
    displayName: 'LaTeX',
    icon: Code,
    description: '수학 공식 블럭',
    category: 'Content',
  },
  {
    type: BlockType.GITHUB_PR,
    displayName: 'GitHub PR',
    icon: Github,
    description: 'GitHub PR 미리보기',
    category: 'Development',
  },
  {
    type: BlockType.REACT_COMPONENT,
    displayName: 'React Component',
    icon: Zap,
    description: 'React 컴포넌트 블럭',
    category: 'Development',
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
          <DialogTitle>블럭 타입 선택</DialogTitle>
          <DialogDescription>
            캔버스에 추가할 블럭 타입을 선택하세요.
          </DialogDescription>
        </DialogHeader>

        <Command className="rounded-md border-0">
          <CommandInput
            placeholder="블럭 타입 검색..."
            className="border-0 focus:ring-0 rounded-md"
          />
          <CommandList>
            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>

            {Object.entries(blockTypesByCategory).map(
              ([category, blockTypeInfos], index) => (
                <React.Fragment key={category}>
                  <CommandGroup heading={category}>
                    {blockTypeInfos.map((blockTypeInfo, blockIndex) => {
                      const IconComponent = blockTypeInfo.icon;
                      return (
                        <CommandItem
                          key={`${category}-${blockTypeInfo.type}-${blockIndex}`}
                          value={`${blockTypeInfo.displayName} ${blockTypeInfo.description}`}
                          onSelect={() =>
                            handleSelectBlockType(blockTypeInfo.type)
                          }
                          className={cn(
                            'flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors',
                            'hover:bg-accent hover:text-accent-foreground'
                          )}
                        >
                          <IconComponent className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {blockTypeInfo.displayName}
                            </span>
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
