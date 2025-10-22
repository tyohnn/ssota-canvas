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
import { FileText, Image, Video, Map, Square, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvasMode } from '../hooks/use-canvas-mode';

/**
 * Block Type 정의 (임시)
 * TODO: Block Management Domain의 BlockTypeInfo 타입 import
 */
interface BlockType {
  type: string;
  displayName: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  category?: string;
}

/**
 * 기본 블럭 타입 목록 (Command 컴포넌트용으로 확장)
 * TODO: Block Management Domain의 useBlockManagement Hook에서 가져오기
 */
const DEFAULT_BLOCK_TYPES: BlockType[] = [
  {
    type: 'basic',
    displayName: 'Basic Block',
    icon: FileText,
    description: 'shadcn basic 블럭 타입',
    category: 'Basic',
  },
  {
    type: 'shape-square',
    displayName: 'Square',
    icon: Square,
    description: '사각형 도형 블럭',
    category: 'Shapes',
  },
  {
    type: 'shape-circle',
    displayName: 'Circle',
    icon: Circle,
    description: '원형 도형 블럭',
    category: 'Shapes',
  },
  {
    type: 'image',
    displayName: 'Image',
    icon: Image,
    description: '이미지 블럭',
    category: 'Media',
  },
  {
    type: 'video',
    displayName: 'Video',
    icon: Video,
    description: '비디오 블럭',
    category: 'Media',
  },
  {
    type: 'map',
    displayName: 'Map',
    icon: Map,
    description: '지도 블럭',
    category: 'Media',
  },
];

/**
 * BlockAddDialog Props
 */
export interface BlockAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlockType: (blockType: string) => void;
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
    (acc, blockType) => {
      const category = blockType.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(blockType);
      return acc;
    },
    {} as Record<string, BlockType[]>
  );

  const handleSelectBlockType = (blockType: string) => {
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
              ([category, blockTypes], index) => (
                <React.Fragment key={category}>
                  <CommandGroup heading={category}>
                    {blockTypes.map(blockType => {
                      const IconComponent = blockType.icon;
                      return (
                        <CommandItem
                          key={blockType.type}
                          value={`${blockType.displayName} ${blockType.description}`}
                          onSelect={() => handleSelectBlockType(blockType.type)}
                          className={cn(
                            'flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors',
                            'hover:bg-accent hover:text-accent-foreground'
                          )}
                        >
                          <IconComponent className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {blockType.displayName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {blockType.description}
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
