'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';

/**
 * Refresh Button Props
 */
export interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading: boolean;
  className?: string;
}

/**
 * Refresh Button Component
 */
export function RefreshButton({
  onRefresh,
  isLoading,
  className,
}: RefreshButtonProps) {
  return (
    <div className="flex justify-end p-4 border-b shrink-0">
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className={`gap-2 ${className || ''}`}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        새로고침
      </Button>
    </div>
  );
}
