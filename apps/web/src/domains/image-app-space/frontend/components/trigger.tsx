'use client';

import { ImageIcon, Compass, Edit3 } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { useImageSpaceContext } from '../core/image-space.context';
import type { TopMenu } from '../core/types';

/**
 * Image Space Trigger Props (노코드 친화적)
 */
export interface ImageSpaceTriggerProps {
  title?: string;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
  openTab?: TopMenu; // 'explore' | 'editor'
}

/**
 * Image Space Trigger
 *
 * Space를 여는 Toolbar Item 버튼
 * Context를 통해 Dialog를 제어 (Props 없음)
 */
export function ImageSpaceTrigger({
  title = 'Image Space',
  className,
  icon: Icon = ImageIcon,
  openTab,
}: ImageSpaceTriggerProps) {
  const { setOpen, setActiveTopMenu } = useImageSpaceContext();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // 탭 설정 (지정된 경우)
    if (openTab) {
      setActiveTopMenu(openTab);
    }

    setOpen(true);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleClick}
          variant="ghost"
          size="sm"
          className={className}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" hasArrow={false} sideOffset={10}>
        <p>{title}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Image Space Explore Trigger
 *
 * 탐색 탭을 여는 트리거 (Compass 아이콘)
 */
export function ImageSpaceExploreTrigger({
  className,
}: {
  className?: string;
}) {
  return (
    <ImageSpaceTrigger
      title="Explore Images"
      icon={Compass}
      openTab="explore"
      className={className}
    />
  );
}

/**
 * Image Space Editor Trigger
 *
 * 에디터 탭을 여는 트리거 (Edit 아이콘)
 */
export function ImageSpaceEditorTrigger({ className }: { className?: string }) {
  return (
    <ImageSpaceTrigger
      title="Image Editor"
      icon={Edit3}
      openTab="editor"
      className={className}
    />
  );
}
