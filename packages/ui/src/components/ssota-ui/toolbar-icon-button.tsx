import type { ReactNode } from 'react';

import type { VariantProps } from 'class-variance-authority';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Toolbar Icon Button Component
 *
 * Tooltip과 Button을 조합한 재사용 가능한 컴포넌트
 * - Presentational 컴포넌트: Props만 받아서 렌더링
 * - Storybook에서 독립적으로 테스트 가능
 */
export interface ToolbarIconButtonProps {
  /**
   * 아이콘 (ReactNode)
   */
  icon: ReactNode;

  /**
   * Tooltip 텍스트
   */
  tooltip: string;

  /**
   * 클릭 핸들러
   */
  onClick: () => void;

  /**
   * 비활성화 여부
   */
  disabled?: boolean;

  /**
   * 추가 className
   */
  className?: string;

  /**
   * Button variant
   * @default "ghost"
   */
  variant?: VariantProps<typeof buttonVariants>['variant'];

  /**
   * Button size
   * @default "sm"
   */
  size?: VariantProps<typeof buttonVariants>['size'];
}

export function ToolbarIconButton({
  icon,
  tooltip,
  onClick,
  disabled = false,
  className = 'h-8 w-8 p-0',
  variant = 'ghost',
  size = 'sm',
}: ToolbarIconButtonProps): React.JSX.Element {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={onClick}
          className={className}
          disabled={disabled}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
